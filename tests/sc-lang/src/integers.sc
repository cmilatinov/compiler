def main() -> int {
    // 3
    let a = 6 + -2 - (3 / 2 * 3) % 2;
    // 4
    let b = (true || false && true) + 3;
    // 3
    let c = ~(-1 * 2) + 4 / 2;
    // 1
    let d = !!2300;
    // 6
    let e = (2 ^ 3 + 23) * 2 / 7;
    // 39
    return a * (b * c - d) + e;
}