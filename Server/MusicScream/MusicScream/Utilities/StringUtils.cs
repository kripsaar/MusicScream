using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Runtime.CompilerServices;
using Action = Microsoft.Azure.KeyVault.Models.Action;

namespace MusicScream.Utilities
{
    public static class StringUtils
    {
        public static int GetLevenshteinDistance(string s, string t)
        {
            var n = s.Length;
            var m = t.Length;
            if (n == 0)
                return m;
            if (m == 0)
                return n;

            var v0 = new int[m + 1];
            var v1 = new int[m + 1];

            for (int i = 0; i <= m; v0[i] = i++) { }

            for (int i = 1; i <= n; ++i)
            {
                v1 = new int[m + 1];
                v1[0] = i;
                for (int j = 1; j <= m; ++j)
                {
                    var cost = s[i - 1] == t[j - 1] ? 0 : 1;
                    v1[j] = Math.Min(Math.Min(v1[j - 1] + 1, v0[j] + 1), v0[j - 1] + cost);
                }

                v0 = v1;
            }

            return v1[m];
        }

        public static int GetLevenshteinDistanceWordOrderIndependent(string s, string t)
        {
            string[] words = t.Split(' ');
            var minDist = int.MaxValue;
            ForAllPermutations(words, strings =>
            {
                var str = string.Join(" ", strings);
                var dist = GetLevenshteinDistance(s, str);
                minDist = Math.Min(minDist, dist);
                if (minDist == 0)
                    return true;
                return false;
            });
            return minDist;
        }

        public static void ForAllPermutations<T>(T[] array, Func<T[], bool> actionAndShouldStop)
        {
            var arraySize = array.Length;

            if (arraySize <= 1)
            {
                actionAndShouldStop(array);
                return;
            }

            var indexes = new int[arraySize];
            for (int i = 0; i < arraySize; ++i)
            {
                indexes[i] = 0;
            }

            if (actionAndShouldStop(array))
                return;

            for (int i = 1; i < arraySize;)
            {
                if (indexes[i] < i)
                {
                    if ((i & 1) == 1)
                    {
                        Swap(ref array[i], ref array[indexes[i]]);
                    }
                    else
                    {
                        Swap(ref array[i], ref array[0]);
                    }

                    if (actionAndShouldStop(array))
                        return;

                    ++indexes[i];

                    i = 1;
                }
                else
                {
                    indexes[i++] = 0;
                }
            }
        }

        private static void Swap<T>(ref T lhs, ref T rhs)
        {
            T temp = lhs;
            lhs = rhs;
            rhs = temp;
        }

        public static IEnumerable<string> GetStringsWithPermutations(IEnumerable<string> strings)
        {
            var res = new List<string>();
            foreach (var str in strings)
            {
                StringUtils.ForAllPermutations(str.Split(" "), splitStr =>
                {
                    res.Add(String.Join(" ", splitStr));
                    return false;
                });
            }

            return res;
        }

        // ReSharper disable once InconsistentNaming
        public static bool ContainsCJK(this string str)
        {
            var res = str.Any(c => (uint) c >= 0x4E00 && (uint) c <= 0x2FA1F);
            return res;
        }
    }
}
