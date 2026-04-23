using System;

namespace ConnectDB.Utils
{
    public static class TimeUtils
    {
        public static DateTime GetVietnamTime()
        {
            var utcNow = DateTime.UtcNow;
            try 
            {
                var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(utcNow, vietnamTimeZone);
            }
            catch (TimeZoneNotFoundException)
            {
                var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
                return TimeZoneInfo.ConvertTimeFromUtc(utcNow, vietnamTimeZone);
            }
        }

        public static DateTime ToVietnamTime(this DateTime utcDateTime)
        {
            try 
            {
                var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, vietnamTimeZone);
            }
            catch (TimeZoneNotFoundException)
            {
                var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
                return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, vietnamTimeZone);
            }
        }
    }
}
