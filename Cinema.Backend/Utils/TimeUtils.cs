using System;

namespace ConnectDB.Utils
{
    public static class TimeUtils
    {
        public static DateTime GetVietnamTime()
        {
            var utcNow = DateTime.UtcNow;
<<<<<<< HEAD
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
=======
            var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(utcNow, vietnamTimeZone);
>>>>>>> 7d9239482c49161f8c9542f4796931a539c7f1d2
        }

        public static DateTime ToVietnamTime(this DateTime utcDateTime)
        {
<<<<<<< HEAD
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
=======
            var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, vietnamTimeZone);
>>>>>>> 7d9239482c49161f8c9542f4796931a539c7f1d2
        }
    }
}
