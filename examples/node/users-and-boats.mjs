// Run after npm run build. These Sets illustrate reservation callbacks;
// production applications must use atomic database inserts with UNIQUE indexes.
import { randomUUID } from 'node:crypto';
import { claimUsername, claimBoatName } from '../../dist/esm/index.js';

const usernames = new Set();
const boatCodes = new Set();
function reserve(registry, code) {
  if (registry.has(code)) return false;
  registry.add(code);
  return true;
}

const userId = randomUUID();
const username = await claimUsername((candidate) => reserve(usernames, candidate));
const user = { id: userId, username };

const boatName = await claimBoatName((candidate) => reserve(boatCodes, candidate.username));
const boat = {
  id: randomUUID(), ownerId: userId,
  name: boatName.display, generatedName: boatName.username,
};
console.log({ user, boat });
