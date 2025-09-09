import random

class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def return_vector(self):
        return self.x + self.y
    
def shuffle(arrayShuffle):
    for x in range (0, len(arrayShuffle) - 1):
        index = int(random.random() * (x+1))
        temp = arrayShuffle[x]

        arrayShuffle[x] = arrayShuffle[index]
        arrayShuffle[index] = temp

def MakePermutation():
    permutation = []
    for i in range(256):
        permutation.append(i)
    
    shuffle(permutation)

    for i in range(256):
        permutation.append(permutation[i])

    return permutation

Permutation = MakePermutation()

def getVector(v):
    h = v & 3

    if h == 0:
        return Vector(1,1)
    elif h == 1:
        return Vector(-1,1)
    elif h == 2:
        return Vector(-1,-1)
    else:
        return Vector(1,-1)
    
def fade(t):
    return ((6*t-15)*t+10) * pow (t,3)

def lerp(t, a, b):
    return a+t*(b-a)

def Noise2D(x,y):
    X = int(x) & 255
    Y = int(y) & 255
    xf = x - int(x)
    yf = y - int(y)

    topRight = Vector(xf-1, yf-1)
    topLeft = Vector(xf, yf-1)
    bottomRight = Vector(xf-1, yf)
    bottomLeft = Vector(xf, yf)

    valueTopRight = Permutation[Permutation[X+1]+Y+1]
    valueTopLeft = Permutation[Permutation[X]+Y+1]
    valueBottomRight = Permutation[Permutation[X+1]+Y]
    valueBottomLeft = Permutation[Permutation[X]+Y]

    dotTopRight = topRight.return_vector(getVector(valueTopRight))
    dotTopLeft = topLeft.return_vector(getVector(valueTopLeft))
    dotBottomRight = bottomRight.return_vector(getVector(valueBottomRight))
    dotBottomLeft = bottomLeft.return_vector(getVector(valueBottomLeft))

    u = fade(xf)
    v = fade(yf)

    return lerp(u, lerp(v, dotBottomLeft, dotTopLeft), lerp(v, dotBottomRight, dotTopRight))

def brownianfractal(x,y,numOctaves):
    result = 0
    amplitude = 1
    frequency = 0.005

    for i in range(numOctaves):
        result += Noise2D(x * frequency, y * frequency) * amplitude
        amplitude *= 0.5
        frequency *= 2

    return result

def perlinRender(xrange, yrange, o):
    colorMatrix = [[0 for x in range(0, xrange)] for y in range(0, yrange)]
    for y in range(0, yrange):
        for x in range(0, xrange):
            n = brownianfractal(x,y,o)
            n = (n + 1) / 2

            c = int(n * 255)
            colorMatrix[y][x] = {'r': c, 'g': c, 'b': c}
    return colorMatrix

