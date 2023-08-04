extern printf: fn(string, int) -> int;

def main() -> int {
    let a = 1 + 2 * 6 / (2 | 3) - 10;
    printf("a = %d", a);
}