export default (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);

  return new Date(0, 0, 0, hours, minutes);
};

export const splitTime = (time: string) => time.split(":").map(Number);
