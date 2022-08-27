import { parseISO } from "date-fns";

export default (rawDate: string) => {
  const splitDate = rawDate.split("/").reverse();
  return parseISO(splitDate.join("-"));
};
