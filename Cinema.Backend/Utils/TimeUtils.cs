using System;

namespace ConnectDB.Utils
{
    public static class TimeUtils
    {
        public static DateTime GetVietnamTime()
        {
            var utcNow = DateTime.UtcNow;
            var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(utcNow, vietnamTimeZone);
        }

        public static DateTime ToVietnamTime(this DateTime utcDateTime)
        {
            var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, vietnamTimeZone);
        }
    }
}
