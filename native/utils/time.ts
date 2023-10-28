import moment from "moment";

export function convertSecondsToReadableTimestamp(seconds: number) {
  const duration = moment.utc(
    moment.duration(seconds, "seconds").asMilliseconds()
  );

  if (duration.hours() > 0) {
    return duration.format("HH:mm:ss");
  }

  return duration.format("mm:ss");
}
