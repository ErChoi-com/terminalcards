#include <vector>
#include <random>
#include <cmath>

struct Color {
    int r, g, b;
};

struct Vector {
    double x, y;
    Vector(double x_, double y_) : x(x_), y(y_) {}
};

void shuffle(std::vector<int>& arrayShuffle) {
    std::random_device rd;
    std::mt19937 gen(rd());
    for (size_t x = 0; x < arrayShuffle.size() - 1; ++x) {
        std::uniform_int_distribution<> dis(0, x);
        int index = dis(gen);
        std::swap(arrayShuffle[x], arrayShuffle[index]);
    }
}

std::vector<int> MakePermutation() {
    std::vector<int> permutation(256);
    for (int i = 0; i < 256; ++i) {
        permutation[i] = i;
    }
    shuffle(permutation);
    permutation.insert(permutation.end(), permutation.begin(), permutation.end());
    return permutation;
}

std::vector<int> Permutation = MakePermutation();

Vector getVector(int v) {
    int h = v & 3;
    if (h == 0) return Vector(1, 1);
    else if (h == 1) return Vector(-1, 1);
    else if (h == 2) return Vector(-1, -1);
    else return Vector(1, -1);
}

double fade(double t) {
    return ((6 * t - 15) * t + 10) * pow(t, 3);
}

double lerp(double t, double a, double b) {
    return a + t * (b - a);
}

double dot(const Vector& a, const Vector& b) {
    return a.x * b.x + a.y * b.y;
}

double Noise2D(double x, double y) {
    int X = static_cast<int>(x) & 255;
    int Y = static_cast<int>(y) & 255;
    double xf = x - static_cast<int>(x);
    double yf = y - static_cast<int>(y);

    Vector topRight(xf - 1, yf - 1);
    Vector topLeft(xf, yf - 1);
    Vector bottomRight(xf - 1, yf);
    Vector bottomLeft(xf, yf);

    int valueTopRight = Permutation[Permutation[X + 1] + Y + 1];
    int valueTopLeft = Permutation[Permutation[X] + Y + 1];
    int valueBottomRight = Permutation[Permutation[X + 1] + Y];
    int valueBottomLeft = Permutation[Permutation[X] + Y];

    double dotTopRight = dot(getVector(valueTopRight), topRight);
    double dotTopLeft = dot(getVector(valueTopLeft), topLeft);
    double dotBottomRight = dot(getVector(valueBottomRight), bottomRight);
    double dotBottomLeft = dot(getVector(valueBottomLeft), bottomLeft);

    double u = fade(xf);
    double v = fade(yf);

    return lerp(u, lerp(v, dotBottomLeft, dotTopLeft), lerp(v, dotBottomRight, dotTopRight));
}

double brownianfractal(double x, double y, int numOctaves) {
    double result = 0;
    double amplitude = 1;
    double frequency = 0.005;

    for (int i = 0; i < numOctaves; ++i) {
        result += Noise2D(x * frequency, y * frequency) * amplitude;
        amplitude *= 0.5;
        frequency *= 2;
    }
    return result;
}

std::vector<std::vector<Color>> render(int xrange, int yrange, int o) {
    std::vector<std::vector<Color>> colorMatrix(yrange, std::vector<Color>(xrange));
    for (int y = 0; y < yrange; ++y) {
        for (int x = 0; x < xrange; ++x) {
            double n = brownianfractal(x, y, o);
            n = (n + 1) / 2;
            int c = static_cast<int>(n * 255);
            colorMatrix[y][x] = {c, c, c};
        }
    }
    return colorMatrix;
}