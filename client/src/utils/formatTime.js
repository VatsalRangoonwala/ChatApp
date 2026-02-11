export const formatMessageTime = (date) => {
  return new Date(date).toLocaleTimeString('en-uk',{
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
};
