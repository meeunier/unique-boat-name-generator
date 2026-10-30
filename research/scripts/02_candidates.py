"""Step 2: automated candidate filtering.

Scores each normalized group for signs of nautical wordplay / dry humour and
flags content that needs a closer look (innuendo, profanity, slurs, alcohol...).
The output is a *candidate* list for human editorial review - nothing here is
accepted automatically.

Usage: python3 -I 02_candidates.py <work_dir>
Outputs: candidates.json, candidates.tsv (sorted by score, then vessel count)
"""
import json
import re
import sys

# --- pun signals: (regex on the space-normalized uppercase name, weight, tag) ---
# Patterns are deliberately specific: "SEA" alone is everywhere (SEA DREAM),
# but "SEAS THE" / "SEA YA" are puns.
SIGNALS = [
    # homophone puns on nautical words
    (r"\bKNOT\b(?!S\b)(?! A\b$)", 3, "knot"),
    (r"\bKNOTS? (?:SO|TODAY|NOW|YET|AGAIN|TONIGHT|WORKING|HOME|ON|MY|YOUR|FOR|IN|A|BAD|TOO|LISTENING|AVAILABLE|GUILTY|PLAYING)\b", 2, "knot"),
    (r"\bKNOTT?Y\b|\bKNOTICAL\b|\bKNOTORIOUS\b", 3, "knot"),
    (r"\bREEL(?:LY)?\b(?! ?REEL)", 2, "reel"),
    (r"\bSEAS? (?:THE|YA|YOU|LA|ESTA|QUEL|RENITY|SAW|FOR)\b|\bSEA ?(?:RENITY|ESTA|QUEL|NILE|DUCTION|CRET|DATIVE)\b|^SEA ?(?:YA|YOU)\b", 3, "sea"),
    (r"\bVITAMIN SEA\b|\bSEA ?SICK\b|\bSEAMS?\b|\bSEA ?LEVEL\b|\bSEA ?MANSHIP\b|\bHIGH SEAS\b", 2, "sea"),
    (r"\bPIER\b|\bPIERS\b", 3, "pier"),
    (r"\bMOOR\b|\bMOORE? ?(?:OR|THAN|FUN|TIME|PLEASE)\b|\bMOORING\b", 3, "moor"),
    (r"\bSTERN\b|\bSTERNLY\b", 3, "stern"),
    (r"\bBERTH\b|\bBERTHDAY\b", 3, "berth"),
    (r"\bBUOYS?\b|\bBUOYANT\b|\bBUOYFRIEND\b|\bOH BUOY\b|\bATTA ?BUOY\b", 3, "buoy"),
    (r"\bWAKE (?:UP|ME|AND|N|IS)\b|\bNO WAKE\b|\bWIDE AWAKE\b|\bWAKE ?(?:ZONE|BOARD)\b|\bIN THE WAKE\b|\bWAKEY\b", 2, "wake"),
    (r"\bHULL\b|\bHULLABALOO\b|\bHULLARIOUS\b|\bHULL ?OF A\b", 3, "hull"),
    (r"\bKEEL\b|\bKEELHAUL\b", 2, "keel"),
    (r"\bOAR\b|\bOARS\b|\bOARSOME\b|\bOARDINARY\b", 3, "oar"),
    (r"\bAWEIGH\b|\bAWAY\b", 1, "aweigh"),
    (r"\bYACHT\b|\bYACHTZEE\b|\bYACHT ?TO\b|\bYACHTA\b|\bYACHTSEE\b", 2, "yacht"),
    (r"\bSAIL(?:A|ING)? (?:LA|AWAY|ON|FOR|OF|BY)\b|\bFOR SAIL\b|\bNOT FOR SAIL\b|\bON SAIL\b|\bSAIL ?LA ?VIE\b|\bWHOLESAIL\b|\bRETAIL\b|\bGARAGE SAIL\b|\bYARD SAIL\b|\bASSAIL\b|\bSAILEBRATE\b", 3, "sail"),
    (r"\bSHORE THING\b|\bFOR SHORE\b|\bSHORE ?(?:LY|ENOUGH)\b|\bOFF ?SHORE\b|\bSHORE ?LEAVE\b", 3, "shore"),
    (r"\bAHOY\b|\bMATEY\b|\bAVAST\b|\bARR+\b|\bSHIVER\b|\bLANDLUBBER\b|\bSCALLYWAG\b|\bPIRATE\b", 1, "pirate"),
    (r"\bSHIP (?:HAPPENS|SHAPE|FACED|WRECKED|OF FOOLS)\b|\bSHIP ?HAPPENS\b|\bRELATION ?SHIP\b|\bFRIEND ?SHIP\b|\bHARDSHIP\b|\bOWNERSHIP\b|\bSPONSORSHIP\b|\bMEMBERSHIP\b|\bSCHOLARSHIP\b|\bCHAMPIONSHIP\b|\bCENSORSHIP\b|\bWORSHIP\b|\bLEADERSHIP\b", 2, "ship"),
    (r"\bANCHOR(?:S)? ?(?:AWAY|MANAGEMENT|BABY|DOWN)\b|\bANCHORMAN\b", 2, "anchor"),
    (r"\bDOCK(?:TOR)?\b|\bDOC\b|\bDOCKTOR\b|\bDOCKTORS\b", 1, "dock"),
    (r"\bTIDE ?(?:ONE|ME|UP|TO|DOWN)\b|\bTIDE ?(?:LESS|ING)\b|\bTIED UP\b|\bTIDY\b|\bLOW TIDE\b|\bHIGH TIDE\b|\bRIP ?TIDE\b|\bYULETIDE\b", 2, "tide"),
    (r"\bWAVE (?:RUNNER|GOODBYE|BYE)\b|\bMICRO ?WAVE\b|\bNEW WAVE\b|\bMAKE WAVES\b|\bWAVE ?LENGTH\b|\bBRAIN ?WAVE\b|\bWAIVE\b", 2, "wave"),
    (r"\bBAIT\b|\bMASTER ?BAIT|\bCLICK ?BAIT\b|\bJAIL ?BAIT\b", 2, "bait"),
    (r"\bHOOKED\b|\bOFF THE HOOK\b|\bHOOKER\b|\bHOOKY\b|\bHOOK ?(?:LINE|UP|ME|ER)\b|\bBY HOOK\b", 2, "hook"),
    (r"\bFIN\b|\bFINS\b|\bFIN ?(?:ALLY|ANCIAL|ITE|ISH|ISHED|ESSE|TASTIC)\b|\bFINTASTIC\b|\bFINANCIAL\b", 1, "fin"),
    (r"\bCOD\b|\bOH MY COD\b|\bCODFATHER\b|\bCODDLE\b", 2, "fish"),
    (r"\bBASS\b|\bBASSMENT\b|\bBASS ?(?:ACKWARDS|ACKWARD)\b|\bKISS MY BASS\b", 2, "fish"),
    (r"\bTUNA\b|\bTROUT\b|\bSALMON\b|\bHALIBUT\b|\bFLOUNDER\b|\bSOLE\b|\bPERCH\b|\bCARP\b|\bEEL\b|\bEELS\b|\bMULLET\b|\bSNAPPER\b|\bGROUPER\b|\bMARLIN\b|\bWAHOO\b|\bGILL\b|\bGILLS\b|\bSCALE\b|\bSCALES\b|\bKRILL\b|\bCLAM\b|\bCLAMS\b|\bOYSTER\b|\bSHRIMP\b|\bPRAWN\b|\bCRAB\b|\bCRABBY\b|\bSHELLFISH\b|\bLOBSTER\b|\bSQUID\b|\bOCTOPUS\b|\bWHALE\b|\bWHALES\b|\bDOLPHIN\b|\bSHARK\b|\bMANATEE\b|\bPORPOISE\b|\bPURPOSE\b|\bPLANKTON\b|\bBARNACLE\b", 1, "sea-life"),
    (r"\bOFFISHAL\b|\bOFISH\b|\bO ?FISH ?AL\b|\bFISH ?(?:Y|ING|N|IN|ERMAN|ICIAL|ALLY|TALES?|STORY|STICKS?|TANK|BOWL|OUT OF WATER)\b|\bFISHFUL\b|\bSHELLFISH\b|\bSELFISH\b|\bGONE FISH|\bREEL ?FISH", 2, "fish"),
    (r"\bHELM\b|\bMAST\b|\bMASTS\b|\bRUDDER\b|\bRUDDERLESS\b|\bGALLEY\b|\bBILGE\b|\bBOW\b|\bBOWS\b|\bAFT\b|\bAFTER\b|\bPROP\b|\bPROPS\b|\bPROPELLER\b|\bHATCH\b|\bLOCKER\b|\bDAVY\b|\bJONES\b|\bPLANK\b|\bCROWS NEST\b|\bPOOP DECK\b|\bDECK\b|\bDECKS\b|\bDECKED\b|\bCABIN\b|\bTRANSOM\b|\bJIB\b|\bBOOM\b|\bSPINNAKER\b|\bRIG\b|\bRIGGED\b|\bLINE\b|\bLINES\b|\bTILLER\b|\bSHEET\b|\bSHEETS\b|\bTACK\b|\bTACKY\b|\bJIBE\b|\bGYBE\b|\bSWAB\b|\bSWABBIE\b|\bPORT\b|\bSTARBOARD\b|\bLEEWAY\b|\bWINDWARD\b|\bLEEWARD\b|\bBALLAST\b|\bFATHOM\b|\bUNFATHOMABLE\b|\bKNOTS\b|\bNAUTICAL\b|\bMARITIME\b|\bMARINA\b|\bBOATSWAIN\b|\bBOSUN\b", 1, "boat-part"),
    (r"\bNAUTI\b|\bNAUTY\b|\bNAUTIGAL\b|\bNAUTI ?(?:BUOY|GIRL|LADY|GAL|CAL|LUS|MOOD|ONE|ABOVE|NAUTI)\b|\bNAUTICAL\b|\bNOTICAL\b|\bNAUGHTI\b|\bNAUGHTICAL\b", 2, "nauti"),
    (r"\bAQUA ?HOLIC\b|\bSHIPFACED\b|\bWET ?(?:DREAM|NURSE|WILLY|WILLIE)\b|\bBOAT ?(?:DRINKS|AHOLIC|OX|Y|ER|ING|LOAD|LOADS|SHOW|RAGE|NIK|ASTIC|LIFE|BUM|PEOPLE|HOUSE|CAMP|TALES|WHISPERER)\b|\bBOATOX\b|\bBOATIQUE\b|\bBOATANICAL\b|\bBOATOMS?\b|\bBOATY MCBOAT|\bMOTOR ?VATED\b|\bMOTOR ?VATION\b|\bMOTION ?SICKNESS\b|\bWATER ?(?:LOGGED|BOARD|PROOF|SHED|FALL|GATE|MELON|COLOR|WORKS)\b|\bH2O\b|\bWET\b|\bSPLASH\b|\bFLOAT\b|\bFLOATING\b|\bFLOATER\b|\bSINK\b|\bSINKING\b|\bSUNK\b|\bUNSINKABLE\b|\bDRIFT\b|\bDRIFTING\b|\bDRIFTER\b|\bADRIFT\b|\bAGROUND\b|\bAGROUNDED\b|\bOVERBOARD\b|\bCAPSIZED?\b|\bSHIPWRECK|\bSHIP ?WRECKED\b|\bMAYDAY\b|\bSOS\b|\bLIFE ?(?:JACKET|RAFT|BOAT|PRESERVER|RING)\b|\bLIFEBOAT\b|\bMAN OVERBOARD\b|\bMUTINY\b|\bMUTINEER\b|\bSEAWORTHY\b|\bUNSEAWORTHY\b", 1, "boat-life"),
    # irony / money / life-situation humour (very common and very good on boats)
    (r"\bASSETS?\b|\bBUDGET\b|\bDEBT\b|\bLOANS?\b|\bMORTGAGE\b|\bINHERITANCE\b|\bBANKRUPT|\bBROKE\b|\bBROKER\b|\bDOLLARS?\b|\bCASH\b|\bTAX\b|\bTAXES\b|\bREFUND\b|\bALIMONY\b|\bLAWYER|\bATTORNEY|\bCHECK\b|\bCHEQUE\b|\bCREDIT\b|\bBILLS?\b|\bINVOICE\b|\bEQUITY\b|\bDIVIDENDS?\b|\bPORTFOLIO\b|\bWRITE ?OFF\b|\bDEDUCTIBLE\b|\bDEDUCTION\b|\bAUDIT\b|\bIRS\b|\bOVERHEAD\b|\bOVERDRAWN\b|\bOVERDRAFT\b|\bOVER BUDGET\b|\bBONUS\b|\bPAYCHECK\b|\bPENSION\b|\bRETIRE|\bSOCIAL SECURITY\b|\b401 ?K\b|\bIRA\b|\bHOLE IN THE WATER\b|\bMONEY ?PIT\b|\bMONEY\b|\bTHOUSAND\b|\bMILLION\b|\bBANK\b|\bPAWN\b|\bCOLLATERAL\b|\bINTEREST\b|\bINVESTMENT\b|\bFORECLOS", 2, "money"),
    (r"\bWIFE\b|\bWIFES\b|\bHUSBAND\b|\bEX ?WIFE\b|\bEX\b|\bHONEY\b|\bHONEY ?DO\b|\bMOTHER ?IN ?LAW\b|\bIN ?LAWS\b|\bKIDS\b|\bCHILDREN\b|\bDIVORCE\b|\bPRENUP\b|\bMARRIAGE\b|\bMID ?LIFE\b|\bCRISIS\b|\bPERMISSION\b|\bDONT TELL\b|\bSHE SAID\b|\bHE SAID\b|\bHERS\b|\bHIS\b|\bYES DEAR\b|\bDEAR\b", 2, "family"),
    (r"\bWORK\b|\bWORKING\b|\bOFFICE\b|\bMEETING\b|\bCONFERENCE\b|\bSICK ?DAY\b|\bVACATION\b|\bWEEKEND\b|\bMONDAY\b|\bFRIDAY\b|\bBOSS\b|\bHR\b|\bCALL\b|\bCALLS\b|\bEMAIL\b|\bVOICEMAIL\b|\bOUT OF OFFICE\b|\bBUSINESS\b|\bCLIENT\b|\bJOB\b|\bQUIT\b|\bFIRED\b|\bOVERTIME\b|\bDEADLINE\b|\bUNPLUGGED\b|\bOFF ?LINE\b|\bOFF ?DUTY\b|\bON ?CALL\b|\bOFF ?CALL\b|\bOFF ?THE ?GRID\b|\bOFF ?THE ?CLOCK\b|\bOFF ?THE ?HOOK\b|\bNO ?SIGNAL\b|\bNO ?SERVICE\b|\bWIFI\b", 1, "work"),
    (r"\bWHY NOT\b|\bWHY KNOT\b|\bWHAT ?EVER\b|\bWHATS HER NAME\b|\bNO ?PROBLEM\b|\bNOT MY PROBLEM\b|\bMY PROBLEM\b|\bMY BAD\b|\bOOPS\b|\bUH ?OH\b|\bWHOOPS\b|\bOH WELL\b|\bOH NO\b|\bOH MY\b|\bDUH\b|\bMEH\b|\bSORRY\b|\bNO COMMENT\b|\bUNDECIDED\b|\bTBD\b|\bNAME ?LESS\b|\bNO ?NAME\b|\bUNNAMED\b|\bWORK IN PROGRESS\b|\bPROJECT\b|\bTHERAPY\b|\bTHERAPIST\b|\bPRESCRIPTION\b|\bDOCTORS? ORDERS\b|\bCHEAPER THAN\b|\bBETTER THAN\b|\bPLAN B\b|\bPLAN C\b|\bLAST RESORT\b|\bAFTERTHOUGHT\b|\bOVERKILL\b|\bEXCUSE\b|\bALIBI\b|\bLOOPHOLE\b|\bIRONY\b|\bIRONIC\b|\bSARCASM\b|\bUNSUPERVISED\b|\bUNSUPERVISED\b|\bLATE\b|\bLATER\b|\bEVENTUALLY\b|\bSOMEDAY\b|\bMANANA\b|\bPROCRASTINAT", 2, "dry"),
    (r"\bPUN\b|\bPUNS\b|\bJOKE\b|\bKIDDING\b|\bSERIOUSLY\b|\bLITERALLY\b|\bTECHNICALLY\b|\bALLEGEDLY\b|\bAPPARENTLY\b|\bUNFORTUNATELY\b|\bACTUALLY\b|\bBASICALLY\b|\bOBVIOUSLY\b|\bPROBABLY\b|\bHOPEFULLY\b|\bTOTALLY\b|\bFINALLY\b|\bAGAIN\b|\bANOTHER\b|\bSTILL\b|\bNEVER ?MIND\b|\bEXACTLY\b|\bWHATEVER\b|\bSOMEHOW\b|\bJUST\b", 1, "dry"),
    (r"\bUNSINKABLE\b|\bTITANIC\b|\bMINNOW\b|\bS ?S ?MINNOW\b|\bGILLIGAN\b|\bHMS\b|\bUSS\b|\bLOVE ?BOAT\b|\bTHREE HOUR TOUR\b|\b3 HOUR TOUR\b|\bBIGGER BOAT\b|\bJAWS\b", 2, "reference"),
    (r"\bSHE ?LL\b|\bSHELL\b|\bSALT\b|\bSALTY\b|\bSALTWATER\b|\bSALT ?LIFE\b|\bBRINE\b|\bBRINY\b|\bSPRAY\b|\bFOAM\b|\bSUDS\b|\bBUBBLES\b|\bCURRENT\b|\bCURRENTLY\b|\bCURRENCY\b|\bCURRENT ?SEE\b|\bSWELL\b|\bSWELLS\b|\bCHOP\b|\bCHOPPY\b|\bSWASH\b|\bBUCKLE\b|\bFLUKE\b|\bFLUKES\b|\bHARBOR\b|\bHARBOUR\b|\bHARBORING\b|\bBAY\b|\bBAYS\b|\bINLET\b|\bCOVE\b|\bREEF\b|\bREEFER\b|\bSANDBAR\b|\bLAGOON\b|\bLAKE\b|\bPOND\b|\bPUDDLE\b|\bRIVER\b|\bCREEK\b|\bUP A CREEK\b|\bPADDLE\b", 1, "water"),
]
SIGNALS = [(re.compile(p), w, t) for p, w, t in SIGNALS]

# Phrase-shape bonus: a short phrase reads as a joke more often than one word.
# Generic elegance / proper names get a penalty.
GENERIC = re.compile(
    r"^(?:MISS|LADY|MS|MRS|MR|SEA|BLUE|SEA ?BREEZE|SERENITY|FREEDOM|ANDIAMO|DREAM|DREAMER|DESTINY|"
    r"SEA ?(?:DREAM|SPRAY|STAR|HAWK|WOLF|QUEST|SPIRIT|ANGEL|GYPSY|BIRD|DOG|FOX|BREEZE|LION))$"
)

# --- review flags: these are NOT auto-excluded; they mark names the editor must check ---
FLAGS = [
    (r"\bSEX|\bSEXY\b|\bNAKED\b|\bNUDE\b|\bTOPLESS\b|\bBOOB|\bTIT|\bTITS\b|\bTITTY\b|\bBREAST|\bNIPPLE|\bBUTT\b|\bBOOTY\b|\bASS\b|\bASSES\b|\bWOODY\b|\bHARD ?ON\b|\bERECT|\bSTIFF\b|\bPECKER\b|\bCOCK\b|\bDICK\b|\bPENIS\b|\bBALLS\b|\bNUTS\b|\bSCREW|\bBANG|\bLAID\b|\bGET ?LUCKY\b|\bORGASM|\bCLIMAX\b|\bKINKY\b|\bHORNY\b|\bSEAMEN\b|\bSEAMAN\b|\bSEMEN\b|\bWET DREAM\b|\bWET WILL|\bMASTER ?BAIT|\bMASTURBAT|\bBLOW ?JOB|\bHAND ?JOB|\bHOOKER\b|\bSTRIP|\bPOLE ?DANC|\bSTRIPPER|\bPORN|\bPLAYMATE\b|\bPLAYBOY\b|\bTHONG\b|\bBIKINI\b|\bPANTIES\b|\bLINGERIE\b|\bSPANK|\bBEAVER\b|\bCOOTER\b|\bMUFF\b|\bPUSS|\bKITTY\b|\bCLOTHES FALL OFF\b|\bWHORE|\bSLUT|\bTRAMP\b|\bBITCH|\bMILF\b|\bCOUGAR\b|\bJUGS\b|\bMELONS\b|\bRACK\b|\bSCORE\b|\bSEDUC|\bDEEP THROAT|\bQUICKIE\b|\bNOONER\b|\bBONER\b|\bBONE\b|\bBONED\b|\bHUMP|\bSHAG|\bPOUND|\bRAMMED\b|\bSWALLOW|\bSPREAD\b|\bLICK|\bSUCK|\bBLOW\b|\bDOWN ?UNDER\b|\bMOIST\b|\bJOHNSON\b|\bWILLY\b|\bWILLIE\b|\bWEINER\b|\bWIENER\b", "sexual"),
    (r"\bFUCK|\bF ?ING\b|\bFKN\b|\bSHIT|\bSH ?T\b|\bDAMN|\bHELL\b|\bCRAP\b|\bPISS|\bBASTARD|\bAH\b|\bWTF\b|\bSOB\b|\bSOAB\b|\bBS\b|\bFU\b|\bSUX\b|\bSUCKS\b", "profanity"),
    (r"\bNIG|\bNEGRO|\bCOON\b|\bSPIC\b|\bWETBACK|\bKIKE\b|\bCHINK|\bJAP\b|\bGOOK|\bFAG|\bDYKE|\bTRANNY|\bRETARD|\bMIDGET|\bGYPSY\b|\bGYPSIES\b|\bGYP\b|\bSQUAW\b|\bREDSKIN|\bINJUN\b|\bESKIMO\b|\bORIENTAL\b|\bHONKY\b|\bCRACKER\b|\bREDNECK\b|\bHILLBILLY\b|\bWHITE ?TRASH\b|\bTRAILER ?TRASH\b|\bHOMO\b|\bLAME\b|\bCRIPPLE|\bPSYCHO\b|\bLUNATIC\b|\bSCHIZO|\bSPAZ", "slur-or-stereotype"),
    (r"\bDRUNK|\bWASTED\b|\bHAMMERED\b|\bBUZZED\b|\bTIPSY\b|\bBOOZE|\bBEER|\bWINE\b|\bWHISK|\bBOURBON\b|\bRUM\b|\bVODKA\b|\bTEQUILA\b|\bMARGARITA|\bCOCKTAIL|\bHAPPY HOUR\b|\bAQUAHOLIC|\bALCOHOL|\bSHOTS?\b|\bKEG\b|\bBREW|\bBARTENDER|\bPARTY|\bLIQUOR|\bSOBER\b|\bHANGOVER|\bHUNG ?OVER\b|\bMIMOSA|\bCHAMPAGNE\b|\bSAKE\b|\bMOONSHINE\b|\bGIN\b|\bPOTHEAD|\bWEED\b|\bREEFER\b|\bHIGH\b|\bSTONED\b|\bBLAZED\b|\bJOINT\b|\bBLUNT\b|\b420\b|\bCOKE\b|\bCOCAINE\b|\bSMUGGL|\bBONG\b|\bTOKE", "alcohol-drugs"),
    (r"\bKILL|\bDEAD\b|\bDEATH\b|\bDIE\b|\bDIED\b|\bMURDER|\bSUICIDE|\bGUN\b|\bGUNS\b|\bBULLET|\bSHOOT|\bBOMB|\bTERROR|\bWAR\b|\bNAZI|\bHITLER|\bKKK\b|\bISIS\b|\bCANCER\b|\bCHEMO\b|\bCORONA\b|\bCOVID|\bRIP\b|\bR I P\b|\bWIDOW|\bFUNERAL\b|\bCOFFIN\b|\bGRAVE\b|\bDROWN|\bSINK|\bSUNK\b|\bSHIPWRECK|\bTITANIC\b", "dark"),
    (r"\bTRUMP\b|\bBIDEN\b|\bOBAMA\b|\bCLINTON\b|\bMAGA\b|\bLIBERAL\b|\bDEMOCRAT|\bREPUBLICAN|\bCONSERVATIVE\b|\bGOP\b|\bLIBTARD|\bSOCIALIS|\bCOMMIE|\bBRANDON\b|\bJESUS\b|\bGOD\b|\bCHRIST\b|\bALLAH\b|\bBIBLE\b|\bPRAY|\bBLESS|\bAMEN\b|\bSATAN\b|\bDEVIL|\bHEAVEN\b|\bSINNER\b|\bSIN\b|\bREBEL\b|\bDIXIE\b|\bCONFEDERA", "politics-religion"),
    (r"\bFAT\b|\bFATTY\b|\bUGLY\b|\bSTUPID\b|\bIDIOT\b|\bMORON\b|\bDUMB|\bLOSER\b|\bFREAK\b|\bWEIRDO\b|\bNERD\b|\bGEEK\b|\bOLD FART|\bFART|\bPOOP|\bTURD\b|\bBARF\b|\bPUKE\b|\bVOMIT|\bBOOGER|\bSNOT\b|\bTOILET|\bPOTTY\b|\bDIARRH|\bGAS\b|\bTOOT\b|\bBURP|\bSTINK|\bSMELL", "unflattering-or-gross"),
]
FLAGS = [(re.compile(p), t) for p, t in FLAGS]


def norm(s: str) -> str:
    s = s.upper().replace("'", "").replace("’", "")
    return re.sub(r"\s+", " ", re.sub(r"[^A-Z0-9 ]", " ", s)).strip()


def main(work: str) -> None:
    groups = json.load(open(f"{work}/groups.json"))
    out = []
    for g in groups:
        n = norm(g["display"])
        words = n.split()
        if not words or all(w.isdigit() for w in words):
            continue
        score = 0
        tags = set()
        for rx, w, t in SIGNALS:
            if rx.search(n):
                score += w
                tags.add(t)
        if score == 0:
            continue
        if GENERIC.match(n):
            score -= 3
        if len(words) >= 2:
            score += 1
        if len(words) >= 3:
            score += 1
        if len(words) == 1 and len(n) < 5:
            score -= 2
        # popularity in the wild: a name chosen by many owners is a tested joke
        if g["total"] >= 3:
            score += 1
        if g["total"] >= 10:
            score += 1
        flags = sorted({t for rx, t in FLAGS if rx.search(n)})
        if score < 3:
            continue
        out.append(
            {
                "key": g["key"],
                "display": g["display"],
                "norm": n,
                "total": g["total"],
                "sources": g["sources"],
                "score": score,
                "tags": sorted(tags),
                "flags": flags,
            }
        )
    out.sort(key=lambda c: (-c["score"], -c["total"], c["norm"]))
    json.dump(out, open(f"{work}/candidates.json", "w"), indent=0)
    with open(f"{work}/candidates.tsv", "w") as f:
        for c in out:
            f.write(f"{c['score']}\t{c['total']}\t{c['norm']}\t{','.join(c['tags'])}\t{','.join(c['flags'])}\n")
    print("candidates:", len(out))
    by = {}
    for c in out:
        by[c["score"]] = by.get(c["score"], 0) + 1
    print(sorted(by.items(), reverse=True))


if __name__ == "__main__":
    main(sys.argv[1])
