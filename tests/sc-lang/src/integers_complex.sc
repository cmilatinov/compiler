extern fn printf(fmt: string, ...) -> int;

def main() -> int {
    printf("%d\n", ((2 + 3) * 4) / (1 + 1));                // Result: 10
    printf("%d\n", -(-5 + 1));                              // Result: 4
    printf("%d\n", !(5 > 2) || (8 & 3));                    // Result: false
    printf("%d\n", (4 <= 5) && (2 >= 2));                   // Result: true
    printf("%d\n", ~(7 ^ 5));                               // Result: -3
    printf("%d\n", (true && false) || (false || true));     // Result: true
    printf("%d\n", 8 % (3 * 2));                            // Result: 2
    printf("%d\n", (10 >> 2) ^ 2);                          // Result: 0
    printf("%d\n", -1 * (5 - 7) + (8 & 9));                 // Result: 10
    printf("%d\n", !(6 == 7) && ((2 | 3) > 2));             // Result: true
    printf("%d\n", (4 + 5) * 2 > 16 && !(2 == 3));          // Result: true
    printf("%d\n", 10 / ((2 + 3) * 2) * 100);               // Result: 100
    printf("%d\n", 15 ^ (6 & 3));                           // Result: 13
    printf("%d\n", (7 + 3) % 5 == 0 || false);              // Result: true
    printf("%d\n", -(-(8 - 6) + (9 * 1)) + 1);              // Result: -6
    printf("%d\n", true || ((2 * 3) & 7) > 1);              // Result: true
    printf("%d\n", (15 << 1) / (3 >> 1));                   // Result: 30
    printf("%d\n", 4 == (2 + 2) && (8 != 8) || false);      // Result: false
    printf("%d\n", !(~(5 & 7)));                            // Result: 0
    printf("%d\n", ((2 + 3) * (5 - 1)) % 7 <= 3 && true);   // Result: 0
}