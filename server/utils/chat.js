export const buildParticipantKey = (...participantIds) => {
  return participantIds
    .map((participantId) => participantId.toString())
    .sort()
    .join(":");
};
