extern fn printf(fmt: string, ...) -> int;

def main() -> int {
    printf("%d\n", -(-5));                      // Result: 5
    printf("%d\n", !(4 == 4) && (6 > 3));       // Result: false
    printf("%d\n", ~15);                        // Result: -16
    printf("%d\n", 7 * (2 + 3));                // Result: 35
    printf("%d\n", 10 % 3);                     // Result: 1
    printf("%d\n", (1 << 3) - 1);               // Result: 7
    printf("%d\n", 12 >> 1);                    // Result: 6
    printf("%d\n", true && (false || true));    // Result: true
    printf("%d\n", 10 / -2);                    // Result: -5
    printf("%d\n", !(8 != 8) || (5 <= 4));      // Result: true
    printf("%d\n", 2 | 6);                      // Result: 6
    printf("%d\n", 3 ^ 9);                      // Result: 10
    printf("%d\n", -(-(-5)));                   // Result: -5
    printf("%d\n", (2 + 3) * 4);                // Result: 20
    printf("%d\n", 7 > 5 && 3 <= 3);            // Result: true
    printf("%d\n", true || (false && true));    // Result: true
    printf("%d\n", 10 % 6);                     // Result: 4
    printf("%d\n", 5 == 5 && !(7 != 7));        // Result: true
    printf("%d\n", 15 & 6);                     // Result: 6
    printf("%d\n", -4 + 7 * 3);                 // Result: 17
}