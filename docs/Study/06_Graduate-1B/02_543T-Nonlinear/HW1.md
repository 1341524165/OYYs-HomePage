---
sidebar_position: 1
id: HW1
title: HW1
tags:
  - Study
  - Graduate
  - Nonlinear Optimization Algorithms
---

## Problem 1.1.4

Use optimality conditions to show that for all $ x > 0 $, we have
$$
\frac{1}{x} + x \geq 2
$$

#### Solution

First, we define the function $$ f(x) = \frac{1}{x} + x $$

So we have $$ f'(x) = -\frac{1}{x^2} + 1 $$

To find the minimum of $ f(x) $, we set $ f'(x) = 0 $ :
$$
1 = \frac{1}{x^2}
$$

As we know that $ x > 0 $, we have **$ x = 1 $**.

And while we check the second derivative, we have:
$$
f''(x) = \frac{2}{x^3}
$$

Since $ x > 0 $, we have $ f''(x) > 0 $, which verifies that $ f(1) $ is the minimum of $ f(x) $.

So we have:
$$
f(x) \geq f(1) = 2
$$

Thus, for all $ x > 0 $, we have:
$$
\frac{1}{x} + x \geq 2
$$


## Problem 1.2.1

Consider the problem of minimizing the function of two variables $ f(x, y) = 3x^2 + y^4 $.
nd 
### (a) Steepest Descent Method

Apply one iteration of the steepest descent method with (1, -2) as the 
starting point and with the stepsize chosen by the Armijo rule with 
$ s = 1, \sigma = 0.1, \beta = 0.5 $.

#### Solution

First, we have the gradient of $ f(x, y) $:
$$
\nabla f(x, y) = \begin{bmatrix} 6x \\ 4y^3 \end{bmatrix}
$$

So we have the direction of steepest descent:
$$
d = -\nabla f(1, -2) = \begin{bmatrix} -6 \\ 32 \end{bmatrix}
$$

Then we can find the stepsize by the Armijo rule:
$$
f(x + \alpha d) \leq f(x) + \sigma \alpha \nabla f(x)^T d
$$

That is:
$$
f(1 + \alpha \cdot (-6), -2 + \alpha \cdot 32) \leq f(1, -2) + 0.1 \alpha \begin{bmatrix} -6 \\ 32 \end{bmatrix}^T \begin{bmatrix} -6 \\ 32 \end{bmatrix}
$$

After calculation, we have:
$$
f(1 - 6\alpha, -2 + 32\alpha) \leq 19 - 106\alpha
$$

So we firstly choose $ \alpha = 1 $, and we have:
$$
f(-5, 30) = 3 \cdot 25 + 30^4 = 810075
$$
While the right side is $ 19 - 106 = -87 $, which obviously does not satisfy the Armijo rule.

As $ \beta = 0.5 $, we choose $ \alpha = 0.5 $ next, and we have:
$$
f(-2, 14) = 3 \cdot 4 + 14^4 = 38428
$$
While the right side is $ 19 - 53 = -34 $, which also does not satisfy.

So we choose $ \alpha = 0.25 $ next, and we have:
$$
f(-0.5, 6) = 3 \cdot 0.25 + 6^4 = 1296.75
$$
While the right side is $ 19 - 26.5 = -7.5 $, which still does not satisfy.

So we choose $ \alpha = 0.125 $ next, and we have:
$$
f(0.25, 2) = 3 \cdot 0.0625 + 2^4 = 16.1875
$$
While the right side is $ 19 - 13.25 = 5.75 $, which is close but still does not satisfy.

So we choose $ \alpha = 0.0625 $ next, and we have:
$$
f(0.625, 0) = 3 \cdot 0.390625 = 1.171875
$$
While the right side is $ 19 - 6.625 = 12.375 $, which satisfies the Armijo rule.

So at last we know that the next point is $ (0.625, 0) $ with the stepsize $ \alpha = 0.0625 $.


### (b) Repeat (a) using $ \beta = 0.1 $

#### Solution

As $ \beta = 0.1 $, we choose $ \alpha = 0.1 $ after the first $ \alpha = 1 $, and we have:
$$
f(0.4, 1.2) = 3 \cdot 0.16 + 1.2^4 = 2.5536
$$
While the right side is $ 19 - 10.6 = 8.4 $, which satisfies the Armijo rule.

So at last we know that the next point is $ (0.4, 1.2) $ with the stepsize $ \alpha = 0.1 $.

`How does the cost of the new iterate compare to that obtained in (a)?`:  
The cost of the new iterate in (a) is $ 1.171875 $, while the cost of the new iterate in (b) is $ 2.5536 $, which is larger.

`Comment on the tradeoffs involved in the choice of $ \beta $`:  
A larger $ \beta $, which means a faster stepsize reduction, leads to slower convergence but ensures the stability.  
While a smaller one retains a faster convergence but with a higher risk of instability.


### (c) Newton's Method

Apply one iteration of Newton's method with the same starting point andstepsize rule as in (a).
 How does the cost of the new iterate compare tothat obtained in (a)? 
 How about the amount of work involved in finding the new iterate?

#### Solution

We have already known the gradient of $ f(1, -2) $:
$$
\nabla f(1, -2) = \begin{bmatrix} 6 \\ -32 \end{bmatrix}
$$

So next we need to calculate the Hessian matrix of $ f(x, y) $:
$$
H = \begin{bmatrix} 6 & 0 \\ 0 & 12y^2 \end{bmatrix}
$$

And the Hessian matrix of $ f(1, -2) $ is:
$$
H(1, -2) = \begin{bmatrix} 6 & 0 \\ 0 & 48 \end{bmatrix}
$$

So we have the direction of Newton's method:
$$
d = -H(1, -2)^{-1} \nabla f(1, -2) = -\begin{bmatrix} 1/6 & 0 \\ 0 & 1/48 \end{bmatrix} \begin{bmatrix} 6 \\ -32 \end{bmatrix} = \begin{bmatrix} -1 \\ 2/3 \end{bmatrix}
$$

So the next point is $ (1, -2) + (-1, 2/3) = (0, -4/3) $.


`How does the cost of the new iterate compare to that obtained in (a)?`:  
The cost of the new iterate here is $ f(0, -4/3) = 3.16 $, which is larger than the cost of the new iterate in (a) $ 1.171875 $.


`How about the amount of work involved in finding the new iterate?`:  
Newton's method requires calculation of the Hessian matrix and solving the linear system.  
In contrast, Steepest Descent only needs to calculate the gradient, so the algorithmic workload is much lower.  
Therefore, the workload of each iteration of Newton's method is much greater than that of gradient descent.


## Problem Ⅲ

### 1.b.1

#### Solution
L-BFGS-B, which stands for `Limited-memory Broyden–Fletcher–Goldfarb–Shanno with Bound constraints`,
 is a `quasi-Newton` optimization method.  
- So firstly, the basic method `L-BFGS`:  
It optimizes gradient descent by memorizing the last $ m $ steps and approximating the Hessian matrix.
- Then the `L-BFGS-B` method:
It adds the **bound constraints** the $ x $ variable, and allows the solution to be **projected** at each iteration to ensure that the solution is within the constraints.

### 1.b.2

#### Solution

|  **Problem**    |    **Solution Time**     |   **Objective Value**   |                **Solution Quality**                    |
|-----------------|--------------------------|-------------------------|--------------------------------------------------------|
| `dqrtic.mod`    |15 sec (65 iterations)    | 1.998169937e-14         | Converged ("NORM OF PROJECTED GRADIENT <= PGTO")       |
| `eigenbls.mod`  |11 sec (1001 iterations)  | 3.529070739e-08         | Max Iteration ("more than maxit iterations")           |
| `freuroth.mod`  |16 sec (21 iterations)    | 608159.189              | Failed ("ABNORMAL_TERMINATION_IN_LNSRC") |


### 2.a

#### Solution

param n := 10;
param A := 10;

var x{i in 1..n} >= -5.12, <= 5.12, default 1.0;

minimize Rastrigin:
    A*n + sum{i in 1..n} (x[i]^2 - A*cos(2*Pi*x[i]));

solve;

display x;
display Rastrigin;


### 2.b

#### Solution
|    **n**    |    **Solution Time**     |   **Objective Value**   |                **Solution Quality**                    |
|-------------|--------------------------|-------------------------|--------------------------------------------------------|
|     10      | 5 sec (4 iterations)    | 9.949590571         | Converged       |
|     20      | 12 sec (4 iterations)   | 19.89918114          | Converged       |
|     50      | 8 sec (4 iterations)    | 49.74795285          | Converged       |
|     100     | 7 sec (4 iterations)    | 99.49590571          | Converged       |
|    1000     | 8 sec (4 iterations)    | 994.9590571           | Converged       |
|    10000    | 2 sec (2 iterations)    | 949.590571            | Failed ("ABNORMAL_TERMINATION_IN_LNSRC")   |

It seems that for low dimensions (like n≤100), L-BFGS-B converges quickly but easily getting stuck in local minimum instead of the global minimum.  
For high dimensions (such as n=1000, n=10000), it either still gets stuck in local minima or is interrupted by memory/time constraints.  
So to get the global optimum, just relying on a single gradient method may not be enough.