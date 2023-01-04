def sqrt(x: float) -> float {
    if (x < 0)
        return 0;
    return x;
}

def quadratic(a: float, b: float, c: float) -> float {
    let t = sqrt(b ^^ 2 - 4 * a * c);
    let x1 = (-b + t) / (2 * a);
    return x1;
}

def main() {
    quadratic(1, 2, 1);
    return;
}