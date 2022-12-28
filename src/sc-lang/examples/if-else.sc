def main() -> int {
    let a: int = 0;
    let c: int = 2;
    if (true) {
        a = 1;
    } else if (false) {
        a = 2;
    } else if (true) {
        a = 3;
    } else {
        a = 4;
    }
    return a;
}