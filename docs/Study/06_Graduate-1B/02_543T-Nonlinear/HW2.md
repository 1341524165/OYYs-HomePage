---
sidebar_position: 2
id: HW2
title: HW2
tags:
  - Study
  - Graduate
  - Algorithms for Nonlinear Optimization
---


## 1. Problem 3.1.1.a) and 3.1.1.b)

Use the Lagrange multiplier theorem to solve the following problems.

### 3.1.1.a)
$ f(x) = ||x||^2 $, $ h(x) = \sum_{i=1}^n x_i^2 - 1 $

#### Solution
Firstly, we need to define the Lagrange function:
$$ L(x, \lambda) = ||x||^2 + \lambda (\sum_{i=1}^n x_i^2 - 1) $$

Then we take the gradient with respect to 
x and set it to zero:
$$ \frac{\partial L}{\partial x_i} = 2x_i + \lambda = 0 $$

So we have:
$$ x_i = -\frac{\lambda}{2} $$

Then we take the gradient with respect to $\lambda$ and set it to zero:
$$ \frac{\partial L}{\partial \lambda} = \sum_{i=1}^n x_i - 1 = 0 $$

Now we can substitute $x_i$ into the equation and then we have:
$$ n(-\frac{\lambda}{2}) - 1 = 0 $$

So:
$$ \lambda = -\frac{2}{n} $$

Then we can substitute $\lambda$ back into the equation of $x_i$:
$$ x_i = -\frac{-\frac{2}{n}}{2} = \frac{1}{n} $$

So the minimum point is:
$$ x^* = (\frac{1}{n}, \frac{1}{n}, \cdots, \frac{1}{n}) $$

**Verification using the Second Order Sufficiency Condition in Proposition 3.2.1:**  
According to the Proposition 3.2.1, we need to check the `Hessian matrix` of the Lagrange function:
$$ \nabla_{xx}^2 L = \nabla^2 f(x) + \lambda \nabla^2 h(x) $$

In which, we have:
$$ \nabla^2 f(x) = \frac{\partial^2}{\partial x_i \partial x_j} (\sum x_i^2) = 2I $$
$$ \nabla^2 h(x) = 0 $$

So we have:
$$ \nabla_{xx}^2 L = 2I $$

Let $ h(x) = \sum_{i=1}^n x_i - 1 = 0 $, we have $ \nabla h(x) = (1, 1, \cdots, 1) $.  
So the tangent space is:
$$ \nabla h(x^*)' y = \sum_{i=1}^n y_i = 0 $$

Then for all $ y \neq 0 $ with $ \nabla h(x^*)' y = 0 $, we have:
$$ y' \nabla_{xx}^2 L y = y^T (2I) y = 2||y||^2 > 0 $$

So the solution is `strictly local minimum`.



### 3.1.1.b)
$ f(x) = \sum_{i=1}^n x_i^2 $, $ h(x) = ||x||^2 - 1 $

#### Solution
Firstly, we need to define the Lagrange function:
$$ L(x, \lambda) = \sum_{i=1}^n x_i + \lambda (\sum_{i=1}^n x_i^2 - 1) $$

Then we take the gradient with respect to
x and set it to zero:
$$ \frac{\partial L}{\partial x_i} = 2\lambda x_i + 1 = 0 $$

So we have:
$$ x_i = -\frac{1}{2\lambda} $$

Then we take the gradient with respect to $\lambda$ and set it to zero:
$$ \frac{\partial L}{\partial \lambda} = \sum_{i=1}^n x_i^2 - 1 = 0 $$

Now we can substitute $x_i$ into the equation and then we have:
$$ \sum_{i=1}^n (-\frac{1}{2\lambda})^2 - 1 = 0 $$
$$ \frac{n}{4\lambda^2} - 1 = 0 $$

So:
$$ \lambda = \pm \frac{\sqrt{n}}{2} $$

Then we can substitute $\lambda$ back into the equation of $x_i$:
$$ x_i = -\frac{1}{2\lambda} = \mp \frac{1}{\sqrt{n}} $$

As we are picking the `minimum`, we should pick the negative one. So the minimum point is:
$$ x^* = (-\frac{1}{\sqrt{n}}, -\frac{1}{\sqrt{n}}, \cdots, -\frac{1}{\sqrt{n}}) $$
And the $ \lambda = \frac{\sqrt{n}}{2} $

**Verification using the Second Order Sufficiency Condition in Proposition 3.2.1:**
Check the `Hessian matrix` of the Lagrange function:
$$ \nabla_{xx}^2 L = \nabla^2 f(x) + \lambda \nabla^2 h(x) $$

In which, we have:
$$ \nabla^2 f(x) = 0 $$
$$ \nabla^2 h(x) = \frac{\partial^2}{\partial x_i \partial x_j} (\sum x_i^2 - 1) = 2I $$

So we have:
$$ \nabla_{xx}^2 L = \lambda \cdot 2I = \frac{\sqrt{n}}{2} \cdot 2I = \sqrt{n}I $$

As $ \nabla h(x) = 2x = 2(-\frac{1}{\sqrt{n}}, -\frac{1}{\sqrt{n}}, \cdots, -\frac{1}{\sqrt{n}}) $, the tangent space is:
$$ \nabla h(x^*)' y = \sum_{i=1}^n (x_i^*)y_i = 0 $$

Then for all $ y \neq 0 $ with $ \nabla h(x^*)' y = 0 $, we have:
$$ y' \nabla_{xx}^2 L y = y^T (\sqrt{n}I) y = \sqrt{n}||y||^2 > 0 $$

So the solution is `strictly local minimum`.



## 2. Industrial design
A cylindrical can is to hold 4 cubic inches of orange juice. The cost per square inch of constructing the metal top and bottom is twice the cost per square inch of constructing the cardboard side. What are the dimensions of the least expensive can?

#### Solution

First define the variables:
- $ r $: `radius` of the base of the can
- $ h $: `height` of the can
- $ C $: `cost` of the can
- $ c $: `cost per square inch` of constructing the cardboard side

Then we have the volume:
$$ V = \pi r^2 h = 4 $$

So the height is: $ h = \frac{4}{\pi r^2} $

Total cost:
$$ C = 2\pi r^2 \cdot 2c + 2\pi rh \cdot c = 4\pi r^2 c + 2\pi rh \cdot c = 4\pi r^2 c + 2\pi r \cdot \frac{4}{\pi r^2} \cdot c = 4\pi r^2 c + \frac{8}{r} c $$

So to minimize the cost, we can just consider minimizing the $ \frac{C}{c} $, as $ c $ is a constant:
$$ \frac{C}{c} = 4\pi r^2 + \frac{8}{r} $$

Then we take the derivative and set it to zero:
$$ f'(r) = 8\pi r - \frac{8}{r^2} = 0 $$

So we have:
$$ r = \frac{1}{\sqrt[3]{\pi}} $$

Verify the second derivative:
$$ f''(r) = 8\pi + \frac{16}{r^3} > 0 $$

So it indeed is a `local minimum`.

Then we subtitute $ r $ back into the equation of $ h $:
$$
h = \frac{4}{\pi r^2} = \frac{4}{\pi \cdot (\frac{1}{\sqrt[3]{\pi}})^2} = \frac{4}{\sqrt[3]{\pi}}
$$

So the dimensions of the least expensive can are:
- $ r = \frac{1}{\sqrt[3]{\pi}} $
- $ h = \frac{4}{\sqrt[3]{\pi}} $



## 3. Duality

Prove that the following two problems are dual to each other:
$$ \min c'x \quad s.t. \quad A'x \geq b $$
$$ \max b'\mu \quad s.t. \quad A\mu = c, \mu \geq 0 $$


#### Solution
As $ A'x \geq b $ is equivalent to $ -A'x \leq -b $, we can introduce the dual variable $ \mu \geq 0 $ and construct the Lagrange function:
$$ L(x, \mu) = c'x + \mu'(-A'x + b) $$

And simplify it:
$$ L(x, \mu) = (c - A\mu)^Tx + \mu^Tb $$

Then we can calculate the partial derivative with respect to $ x $:
$$ \frac{\partial L}{\partial x} = c - A\mu $$

If $ \frac{\partial L}{\partial \mu} \neq 0 $, as $ x $ is unbounded, $ L $ will not have a lower bound. So we have to set $ \frac{\partial L}{\partial x} = 0 $.

We have:
$ L(x, \mu) = \mu^Tb $

So the dual problem is to maximize $ \mu^Tb $ subject to $ A\mu = c $ and $ \mu \geq 0 $.

The two problems are indeed dual to each other.


## 4. Problem 4.2.1 (a) (b) and (d)

$$
\min f(x) = \frac{1}{2} (x_1^2 - x_2^2) - 3x_2 \quad s.t. \quad x_2 = 0
$$

### (a)

Calculate the optimal solution and the Lagrange multiplier.

#### Solution
First construct the Lagrange function:
$$ L(x, \lambda) = \frac{1}{2} (x_1^2 - x_2^2) - 3x_2 + \lambda x_2 $$

Then we take the gradient with respect to $ x_1 $ and set it to zero:
$$ \frac{\partial L}{\partial x_1} = x_1 = 0 $$

Then with respect to $ x_2 $ and set it to zero:
$$ \frac{\partial L}{\partial x_2} = -x_2 - 3 + \lambda = 0 $$

Then to $ \lambda $:
$$ \frac{\partial L}{\partial \lambda} = x_2 = 0 $$

We substitute $ x_2 = 0 $ into the equation of $ x_2 $. So we get:
$$ \lambda = 3 $$

So the optimal solution and the Lagrange multiplier are:
$$ x^* = (x_1, x_2) = (0, 0) \quad \lambda = 3 $$


### (b)

For $ k = 0, 1, 2 $ and $ c^k = 10^{k+1} $ calculate and compare the iterates of the quadratic penalty method with $ \lambda^k = 0 $ for all k, and the method of multipliers with $ \lambda^0 = 0 $.

#### Solution

First the augmented Lagrangian function is:
$$ L(x, \lambda) = \frac{1}{2} (x_1^2 - x_2^2) - 3x_2 + \lambda x_2 + \frac{c}{2} x_2^2 $$

***Quadratic penalty method:***

As $ \lambda^k = 0 $, we have:
$$ L(x, \lambda) = \frac{1}{2} (x_1^2 - x_2^2) - 3x_2 + \frac{c}{2} x_2^2 $$

Then we take the gradient with respect to $ x_1 $ and set it to zero:
$$ \frac{\partial L}{\partial x_1} = x_1 = 0 $$

Then $ x_2 $:
$$ \frac{\partial L}{\partial x_2} = -x_2 - 3 + cx_2 = 0 $$
$$ x_2 = \frac{3}{c - 1} $$

- For $ k = 0 $, $ c^0 = 10^1 = 10 $: $ x_2 = \frac{3}{10 - 1} = \frac{1}{3} $
- For $ k = 1 $, $ c^1 = 10^2 = 100 $: $ x_2 = \frac{3}{100 - 1} = \frac{3}{99} = \frac{1}{33} $
- For $ k = 2 $, $ c^2 = 10^3 = 1000 $: $ x_2 = \frac{3}{1000 - 1} = \frac{3}{999} = \frac{1}{333} $

***Method of multipliers:***

Do partial derivative to $ x_1 $ and set it to zero:
$$ \frac{\partial L}{\partial x_1} = x_1 = 0 $$

Then $ x_2 $:
$$ \frac{\partial L}{\partial x_2} = -x_2 - 3 + \lambda + cx_2 = 0 $$
$$ x_2 = \frac{3 - \lambda}{c - 1} $$

Now we can start to iterate with the initial value of $ \lambda^0 = 0 $:
- For $ k = 0 $, $ \lambda^0 = 0 $, $ c^0 = 10^1 = 10 $:  
$$ x_2 = \frac{3 - 0}{10 - 1} = \frac{1}{3} $$
$$ \lambda^1 = \lambda^0 + c^0 x_2 = 0 + 10 \cdot \frac{1}{3} = \frac{10}{3} $$

- For $ k = 1 $, $ \lambda^1 = \frac{10}{3} $, $ c^1 = 10^2 = 100 $:
$$ x_2 = \frac{3 - \frac{10}{3}}{100 - 1} = \frac{\frac{1}{3}}{99} = -\frac{1}{297} $$
$$ \lambda^2 = \lambda^1 + c^1 x_2 = \frac{10}{3} + 100 \cdot (-\frac{1}{297}) = \frac{890}{297} $$

- For $ k = 2 $, $ \lambda^2 = \frac{890}{297} $, $ c^2 = 10^3 = 1000 $:
$$ x_2 = \frac{3 - \frac{890}{297}}{1000 - 1} \approx 0.000004 $$
$$ \lambda^3 = \lambda^2 + c^2 x_2 \approx 2.996 + 1000 \cdot 0.000004 =3 $$

So after all, we can say that the `method of multipliers` converges **much faster than** the `quadratic penalty method`.


## 5. Mathematical modeling for data mining


### AMPL model file

```AMPL
set COUNTRIES;

param x1{COUNTRIES};  # Social setting
param x2{COUNTRIES};  # Effort
param y{COUNTRIES};   # Observed change

var a1;  # Coefficient for x1
var a2;  # Coefficient for x2
var b;   # Intercept

minimize MSE:
    sum{i in COUNTRIES} (y[i] - (a1 * x1[i] + a2 * x2[i] + b))^2;



# DATA SECTION
data;

set COUNTRIES := Bolivia Brazil Chile Colombia CostaRica Cuba DominicanRep Ecuador ElSalvador Guatemala Haiti Honduras Jamaica Mexico Nicaragua Panama Paraguay Peru TrinidadTobago Venezuela;

param x1 :=
    Bolivia         46
    Brazil          74
    Chile           89
    Colombia        77
    CostaRica       84
    Cuba            89
    DominicanRep    68
    Ecuador         70
    ElSalvador      60
    Guatemala       55
    Haiti           35
    Honduras        51
    Jamaica         87
    Mexico          83
    Nicaragua       68
    Panama          84
    Paraguay        74
    Peru            73
    TrinidadTobago  84
    Venezuela       91;

param x2 :=
    Bolivia         0
    Brazil          0
    Chile           16
    Colombia        16
    CostaRica       21
    Cuba            15
    DominicanRep    14
    Ecuador         6
    ElSalvador      13
    Guatemala       9
    Haiti           3
    Honduras        7
    Jamaica         23
    Mexico          4
    Nicaragua       0
    Panama          19
    Paraguay        3
    Peru            0
    TrinidadTobago  15
    Venezuela       7;

param y :=
    Bolivia         1
    Brazil          10
    Chile           29
    Colombia        25
    CostaRica       29
    Cuba            40
    DominicanRep    21
    Ecuador         0
    ElSalvador      13
    Guatemala       4
    Haiti           0
    Honduras        7
    Jamaica         21
    Mexico          9
    Nicaragua       7
    Panama          22
    Paraguay        6
    Peru            2
    TrinidadTobago  29
    Venezuela       11;


# display parameters after solving
solve;
display a1, a2, b, MSE;
```

### print-out of the solution from the NEOS server

```AMPL
*************************************************************

   NEOS Server Version 6.0
   Job#     : 15750375
   Password : bTOlUkJR
   User     : 
   Solver   : nco:MINOS:AMPL
   Start    : 2025-03-17 21:13:44
   End      : 2025-03-17 21:13:53
   Host     : prod-sub-1.neos-server.org

   Disclaimer:

   This information is provided without any express or
   implied warranty. In particular, there is no warranty
   of any kind concerning the fitness of this
   information for any particular purpose.

   Announcements:
*************************************************************
The license for this AMPL processor will expire in 13.9 days.
tions...
Executing AMPL.
processing data.
processing commands.
Executing on prod-exec-6.neos-server.org

3 variables, all nonlinear
0 constraints
1 nonlinear objective; 3 nonzeros.

MINOS 5.51: optimal solution found.
7 iterations, objective 694.0056746
Nonlin evals: obj = 16, grad = 15.
a1 = 0.270589
a2 = 0.967714
b = -14.4511
MSE = 694.006
```

### model error table

| Country        | x1  | x2  | y    | Predicted ŷ    | Error (y - ŷ) |
|----------------|-----|-----|------|-----------------|----------------|
| Bolivia        | 46  | 0   | 1    |  -2.00            |   3.00           |
| Brazil         | 74  | 0   | 10   |   5.57            |   4.43           |
| Chile          | 89  | 16  | 29   |  25.11            |   3.89           |
| Colombia       | 77  | 16  | 25   |  21.87            |   3.13           |
| CostaRica      | 84  | 21  | 29   |  28.60            |   0.40           |
| Cuba           | 89  | 15  | 40   |  24.15            |  15.85           |
| DominicanRep   | 68  | 14  | 21   |  17.50            |   3.50           |
| Ecuador        | 70  | 6   | 0    |  10.30            | -10.30           |
| ElSalvador     | 60  | 13  | 13   |  14.36            |  -1.36           |
| Guatemala      | 55  | 9   | 4    |   9.14            |  -5.14           |
| Haiti          | 35  | 3   | 0    |  -2.08            |   2.08           |
| Honduras       | 51  | 7   | 7    |   6.12            |   0.88           |
| Jamaica        | 87  | 23  | 21   |  31.35            | -10.35           |
| Mexico         | 83  | 4   | 9    |  11.88            |  -2.88           |
| Nicaragua      | 68  | 0   | 7    |   3.95            |   3.05           |
| Panama         | 84  | 19  | 22   |  26.66            |  -4.66           |
| Paraguay       | 74  | 3   | 6    |   8.48            |  -2.48           |
| Peru           | 73  | 0   | 2    |   5.30            |  -3.30           |
| TrinidadTobago | 84  | 15  | 29   |  22.79            |   6.21           |
| Venezuela      | 91  | 7   | 11   |  16.95            |  -5.95           |

### Discussion

- $ a_1 = 0.270589 $: Once the `social setting`($ x_1 $) increases by 1 unit, the predicted CBR change in the observed change is 0.270589.
- $ a_2 = 0.967714 $: Once the `effort`($ x_2 $) increases by 1 unit, the predicted CBR change in the observed change is 0.967714, which is a much stronger effect than the `social setting`.

So we can say that the `effort` ($ x_2 $) shows a **stronger relationship** with CBR change.

- $ MSE = 694.006 $: As our MSE formula is $ \sum (y - \hat{y})^2 $, the average error is $ \frac{1}{20} \sqrt{694.006} \approx 1.32 $， which can be considered as a small error given $ y $ ranges from 0 to 40.
- $ b = -14.4511 $: But the negative intercept implies that without setting or effort, CBR change will be negative, which is unreasonable.

Overall, I would say that the model captures general trends well, but maybe shows poor performance in some extreme cases.
