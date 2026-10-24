export const isSamplePerson = (person) => Boolean(person?.id?.startsWith('u-'));

export function accountPerson(profile) {
  return { id: profile.id, name: profile.username, type: 'student' };
}

export function peopleForDiscovery(users, viewerId) {
  return users.filter((person) => person.type === 'student' && person.id !== viewerId)
    .toSorted((a, b) => Number(isSamplePerson(a)) - Number(isSamplePerson(b)) || a.name.localeCompare(b.name));
}
