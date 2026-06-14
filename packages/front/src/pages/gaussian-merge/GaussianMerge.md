# Merging Gaussians with Moment Matching

Suppose you have a pile of Gaussians, and you want fewer of them. Not a random
subset, fewer Gaussians that *together still look like the original pile*. This
shows up everywhere: target tracking keeps the size of a Gaussian mixture under
control, and — the reason I ran into it — rendering a density heatmap of a
timeseries, where hundreds of thousands of weighted kernels have to be collapsed
into something the size of the screen before they hit the GPU.

The trick that makes this work is **moment matching**: instead of trying to match
the *shape* of the combined function, we match its **moments** — total mass,
centroid, and spread. It turns out that getting those three numbers right is
enough to produce a single Gaussian that is a remarkably good stand-in for a
whole group of them.

## A single Gaussian

Let's start with the object we are manipulating. A one-dimensional Gaussian
kernel is

<latex-math>
 f(x)=\frac{1}{\sigma\sqrt{2\pi}}\,e^{-\frac{(x-\mu)^2}{2\sigma^2}}
</latex-math>

with a center <latex-math inline>\mu</latex-math>, a width <latex-math inline>\sigma</latex-math>,
and (once we attach a weight to it) a mass. Drag the slider below to see how
<latex-math inline>\sigma</latex-math> trades height for width while the area underneath
stays fixed.

<gaussian-merge-example example="single"></gaussian-merge-example>

## What "merging" should mean

The naive thing to do when you want to combine two kernels is to average their
positions — a barycenter merge. That keeps the centroid in the right place but
throws away the fact that the two kernels were *apart*. The merged kernel ends up
too thin: it forgets that the original mass was spread across a region.

Moment matching fixes this by asking a sharper question. Given a weighted set of
components, what is the single Gaussian whose **zeroth, first, and second
moments** match those of the whole set? Those three moments are exactly mass,
mean, and variance.

For a set of <latex-math inline>N</latex-math> weighted components
<latex-math inline>(w_i, \mu_i, \sigma_i^2)</latex-math>, the answer is

<latex-math>
 w = \sum_{i=1}^{N} w_i
</latex-math>

<latex-math>
 \mu = \frac{1}{w}\sum_{i=1}^{N} w_i\,\mu_i
</latex-math>

<latex-math>
 \sigma^2 = \frac{1}{w}\sum_{i=1}^{N} w_i\left[\sigma_i^2 + (\mu_i-\mu)^2\right]
</latex-math>

The first two lines are unsurprising: total weight adds, and the new center is
the weighted average of the old centers. The third line is where the magic is.
The merged variance is not just the average of the input variances — it is that
average **plus** the spread of the centers around the new mean. That
<latex-math inline>(\mu_i-\mu)^2</latex-math> term is precisely the parallel-axis theorem:
it accounts for the distance each component sat from the merged centroid, so the
merged kernel is appropriately wider. This is what the barycenter merge forgets.

## Two kernels at a time

In practice merges happen pairwise. Given components <latex-math inline>i</latex-math> and
<latex-math inline>j</latex-math>, the moment-preserving merge collapses them into

<latex-math>
 w_{ij} = w_i + w_j
</latex-math>

<latex-math>
 \mu_{ij} = \frac{w_i}{w_i + w_j}\,\mu_i + \frac{w_j}{w_i + w_j}\,\mu_j
</latex-math>

<latex-math>
 \sigma_{ij}^2 = \frac{w_i\,\sigma_i^2 + w_j\,\sigma_j^2}{w_i + w_j} + \frac{w_i w_j}{(w_i + w_j)^2}(\mu_i-\mu_j)^2
</latex-math>

This is just the <latex-math inline>N=2</latex-math> special case of the general formula
above, and applying it repeatedly to pairs reproduces the full-set result exactly.

In the example below, **Gaussian A** and **Gaussian B** are two weighted kernels.
The yellow curve is their true sum <latex-math inline>f(x) = N_a + N_b</latex-math> — the
thing we are trying to approximate — and the dark dashed curve is the single
moment-matched Gaussian that replaces them. The red curve is the absolute error
between the two. Pull the centers apart and watch how the merged Gaussian widens
to cover both, and how the error grows as the two bumps separate enough to no
longer look like one.

<gaussian-merge-example example="merge"></gaussian-merge-example>

When the centers are close — separation on the order of a single
<latex-math inline>\sigma</latex-math> — the merged Gaussian is nearly indistinguishable
from the true sum, and the error curve barely lifts off the axis. This is exactly
the regime we want to merge in: combine things that are already visually
overlapping, and leave clearly separated structure alone.

## Going to two dimensions

The same idea generalizes cleanly to higher dimensions; we just replace the scalar
variance with a covariance matrix <latex-math inline>\mathbf{P}</latex-math>. A weighted
2D Gaussian is

<latex-math>
\mathcal{N}(\mathbf{x}; A, \boldsymbol{\mu}, \mathbf{P}) = A\,\exp\!\left(-\tfrac{1}{2}(\mathbf{x}-\boldsymbol{\mu})^T \mathbf{P}^{-1}(\mathbf{x}-\boldsymbol{\mu})\right)
</latex-math>

where **P** is defined as

<latex-math>
\mathbf{P} = \begin{bmatrix}\sigma_x^2 & \rho\,\sigma_x\sigma_y \\ \rho\,\sigma_x\sigma_y & \sigma_y^2\end{bmatrix}
</latex-math>

where <latex-math inline>\boldsymbol{\mu}\in\mathbb{R}^2</latex-math> is the center and
<latex-math inline>\mathbf{P}</latex-math> is a symmetric positive-definite
<latex-math inline>2\times 2</latex-math> matrix that encodes both the widths and the
*orientation* of the kernel. A convenient way to picture such a Gaussian is as an
**ellipse**: a constant-density contour whose axes are the eigenvectors of
<latex-math inline>\mathbf{P}</latex-math> and whose radii are proportional to the square
roots of its eigenvalues.

The moment-matching merge carries over almost verbatim. Total weight and centroid
are unchanged, and the covariance becomes

<latex-math>
\mathbf{P}_{ij} = \frac{w_i\,\mathbf{P}_i + w_j\,\mathbf{P}_j}{w_i + w_j} + \frac{w_i w_j}{(w_i + w_j)^2}(\boldsymbol{\mu}_i-\boldsymbol{\mu}_j)(\boldsymbol{\mu}_i-\boldsymbol{\mu}_j)^T
</latex-math>

The scalar <latex-math inline>(\mu_i-\mu_j)^2</latex-math> from the 1D case is now an
**outer product** <latex-math inline>(\boldsymbol{\mu}_i-\boldsymbol{\mu}_j)(\boldsymbol{\mu}_i-\boldsymbol{\mu}_j)^T</latex-math>,
a rank-one matrix that stretches the merged covariance along the direction
separating the two centers. Same parallel-axis theorem, now with a direction.

## From covariance to ellipse

Before drawing anything, we need to turn the matrix <latex-math inline>\mathbf{P}</latex-math>
into something with a shape, a size, and an angle. The bridge is the
**constant-density contour**: the set of points where the exponent in the
Gaussian is held fixed,

<latex-math>
(\mathbf{x}-\boldsymbol{\mu})^T \mathbf{P}^{-1}(\mathbf{x}-\boldsymbol{\mu}) = c^2
</latex-math>

Because <latex-math inline>\mathbf{P}</latex-math> is symmetric positive-definite, this
quadratic form is always an ellipse centered at <latex-math inline>\boldsymbol{\mu}</latex-math>.
The left-hand side is the squared **Mahalanobis distance**, so a contour is just
the locus of points that sit equally far from the center in the metric the
covariance defines. The scalar <latex-math inline>c</latex-math> picks *which* contour:
<latex-math inline>c=1</latex-math> is the one-<latex-math inline>\sigma</latex-math> ellipse,
<latex-math inline>c=2</latex-math> the two-<latex-math inline>\sigma</latex-math> one.

### Diagonalization

To read off the geometry, diagonalize the covariance:

<latex-math>
\mathbf{P} = \mathbf{R}\,\boldsymbol{\Lambda}\,\mathbf{R}^T, \qquad \boldsymbol{\Lambda} = \begin{bmatrix}\lambda_1 & 0\\ 0 & \lambda_2\end{bmatrix}
</latex-math>

This is the **spectral decomposition** — the form of eigendecomposition reserved
for symmetric matrices. The spectral theorem guarantees that a real symmetric
<latex-math inline>\mathbf{P}</latex-math> has real eigenvalues and *orthogonal*
eigenvectors, so <latex-math inline>\mathbf{R}</latex-math> can be chosen orthogonal
(<latex-math inline>\mathbf{R}^{-1} = \mathbf{R}^T</latex-math>, hence the
<latex-math inline>\mathbf{R}^T</latex-math> rather than a general inverse). Geometrically
<latex-math inline>\mathbf{R}</latex-math> is then a pure rotation: it rotates into the
eigenbasis, <latex-math inline>\boldsymbol{\Lambda}</latex-math> scales along the axes, and
<latex-math inline>\mathbf{R}^T</latex-math> rotates back. Because
<latex-math inline>\mathbf{P}</latex-math> is also positive-definite the eigenvalues are
strictly positive, so the <latex-math inline>\sqrt{\lambda_k}</latex-math> below are real and
the ellipse never degenerates.

The eigenvectors (the columns of <latex-math inline>\mathbf{R}</latex-math>) are the
**directions of the ellipse's axes**, and the eigenvalues
<latex-math inline>\lambda_1,\lambda_2</latex-math> are the variances along those axes. In
the rotated eigenbasis the contour decouples into the familiar form

<latex-math>
\frac{y_1^2}{\lambda_1} + \frac{y_2^2}{\lambda_2} = c^2
</latex-math>

so each semi-axis has length <latex-math inline>r_k = c\,\sqrt{\lambda_k}</latex-math> — the
standard deviation along that axis, scaled by the contour level.

### Lots of algebra

For a <latex-math inline>2\times 2</latex-math> matrix we don't need a general eigensolver;
everything has a closed form in terms of the entries. Writing

<latex-math>
\mathbf{P} = \begin{bmatrix} p_{11} & p_{12} \\ p_{12} & p_{22} \end{bmatrix}
</latex-math>

(with <latex-math inline>p_{21} = p_{12}</latex-math> by symmetry), the eigenvalues are the
roots of the characteristic polynomial
<latex-math inline>\det(\mathbf{P} - \lambda \mathbf{I}) = 0</latex-math>, i.e.
<latex-math inline>\lambda^2 - (p_{11}+p_{22})\,\lambda + (p_{11}p_{22} - p_{12}^2) = 0</latex-math>.
The trace and determinant give the two roots directly:

<latex-math>
\lambda_{1,2} = \frac{p_{11}+p_{22}}{2} \pm \sqrt{\left(\frac{p_{11}-p_{22}}{2}\right)^{2} + p_{12}^{2}}
</latex-math>

with <latex-math inline>\lambda_1</latex-math> the larger root (the major axis). The square root
is real because the symmetric matrix guarantees real eigenvalues, and both roots are
positive when <latex-math inline>\mathbf{P}</latex-math> is positive-definite.

The orientation follows from the eigenvector of <latex-math inline>\lambda_1</latex-math>.
Solving <latex-math inline>(\mathbf{P} - \lambda_1 \mathbf{I})\mathbf{v}_1 = 0</latex-math>
gives the major-axis direction, and its angle collapses to a single expression in the
entries:

<latex-math>
\theta = \frac{1}{2}\operatorname{atan2}\!\big(2\,p_{12},\; p_{11} - p_{22}\big)
</latex-math>

The orthonormal rotation matrix is then just that angle and its perpendicular:

<latex-math>
\mathbf{R} = \begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix}
</latex-math>

(The <latex-math inline>\tfrac{1}{2}</latex-math> and the doubled
<latex-math inline>p_{12}</latex-math> are the double-angle identity at work: the quadratic form
mixes the axes through <latex-math inline>2p_{12}\,xy</latex-math>, so the de-mixing angle is half
the <latex-math inline>\operatorname{atan2}</latex-math>.) When <latex-math inline>p_{12}=0</latex-math>
the matrix is already diagonal, <latex-math inline>\theta=0</latex-math>, and the ellipse is
axis-aligned with <latex-math inline>\lambda_1 = p_{11}</latex-math>,
<latex-math inline>\lambda_2 = p_{22}</latex-math>, as expected.

### Drawing the ellipse with orthogonal diagonalization

With <latex-math inline>\lambda_{1,2}</latex-math> and <latex-math inline>\mathbf{R}</latex-math> in hand, drawing the ellipse is mechanical: set the
semi-axes <latex-math inline>a = c\sqrt{\lambda_1}</latex-math> and
<latex-math inline>b = c\sqrt{\lambda_2}</latex-math>, and trace

<latex-math>
\mathbf{x}(t) = \boldsymbol{\mu} + \mathbf{R}\begin{bmatrix} a\cos t \\ b\sin t \end{bmatrix}, \qquad t\in[0,2\pi)
</latex-math>

The eigenvectors set the **orientation**, the square-rooted eigenvalues set the
**shape and width**, and <latex-math inline>c</latex-math> selects which density level the
contour traces.

### Cholesky decomposition

If all we want is to *draw* the ellipse — rather than report its axis angle — there
is a cheaper route that skips eigenvalues entirely. Any symmetric positive-definite
<latex-math inline>\mathbf{P}</latex-math> has a unique **Cholesky factorization**

<latex-math>
\mathbf{P} = \mathbf{L}\mathbf{L}^T
</latex-math>

where <latex-math inline>\mathbf{L}</latex-math> is lower-triangular with positive diagonal.
For the <latex-math inline>2\times 2</latex-math> case the factor is explicit:

<latex-math>
\mathbf{L} = \begin{bmatrix} \sqrt{p_{11}} & 0 \\[4pt] \dfrac{p_{12}}{\sqrt{p_{11}}} & \sqrt{p_{22} - \dfrac{p_{12}^2}{p_{11}}} \end{bmatrix}
</latex-math>

The diagonal terms are real exactly when <latex-math inline>p_{11}>0</latex-math> and the
**Schur complement** <latex-math inline>p_{22} - p_{12}^2/p_{11} > 0</latex-math>, which is just
the positive-definiteness of <latex-math inline>\mathbf{P}</latex-math> restated — the same
condition that kept the eigenvalues positive.

Why does this draw the ellipse? Substitute
<latex-math inline>\mathbf{x}-\boldsymbol{\mu} = \mathbf{L}\mathbf{z}</latex-math> into the contour
equation and the metric collapses to the identity:

<latex-math>
(\mathbf{x}-\boldsymbol{\mu})^T \mathbf{P}^{-1}(\mathbf{x}-\boldsymbol{\mu}) = \mathbf{z}^T \mathbf{L}^T (\mathbf{L}\mathbf{L}^T)^{-1} \mathbf{L}\,\mathbf{z} = \mathbf{z}^T\mathbf{z} = c^2
</latex-math>

So in <latex-math inline>\mathbf{z}</latex-math>-coordinates the contour is simply a circle of
radius <latex-math inline>c</latex-math>. What it means is that a circle in the <latex-math inline>\mathbf{z}</latex-math> world when mapped through <latex-math inline>\mathbf{L}</latex-math> becomes an ellipse in the <latex-math inline>\mathbf{x}</latex-math> world, or ellipses in the <latex-math inline>\mathbf{x}</latex-math> world when mapped to <latex-math inline>\mathbf{L}^{-1}</latex-math> become circles in the <latex-math inline>\mathbf{z}</latex-math> world. To trace the ellipse we run a unit circle through
<latex-math inline>\mathbf{L}</latex-math>:

<latex-math>
\mathbf{x}(t) = \boldsymbol{\mu} + c\,\mathbf{L}\begin{bmatrix} \cos t \\ \sin t \end{bmatrix}, \qquad t\in[0,2\pi)
</latex-math>

This is the same affine recipe as before, with <latex-math inline>\mathbf{L}</latex-math> playing
the role that <latex-math inline>\mathbf{R}\,\boldsymbol{\Lambda}^{1/2}</latex-math> played in the
diagonalization version — both map the unit circle onto the same ellipse. The one
caveat: <latex-math inline>\mathbf{L}</latex-math> is triangular, **not** a rotation, so its
columns are *not* the ellipse's axes and it tells you nothing about the orientation
angle. Cholesky is the tool when you want to render the curve (or sample from the
Gaussian — <latex-math inline>\boldsymbol{\mu} + \mathbf{L}\mathbf{z}</latex-math> with
<latex-math inline>\mathbf{z}\sim\mathcal{N}(\mathbf{0},\mathbf{I})</latex-math> draws a point from
it); reach for the eigendecomposition when you actually need the axes and angle. For
the <latex-math inline>2\times 2</latex-math> demo both are closed-form and equally cheap.

In the example below, **Gaussian A** and **Gaussian B** are drawn as ellipses
(the solid contour is one <latex-math inline>\sigma</latex-math>, the faint one is two),
and the dark dashed ellipse is their moment-matched merge. Each kernel has its own
widths, rotation, and weight. Notice how the merged ellipse not only sits at the
weighted midpoint but also *elongates* along the line joining A and B — that is
the outer-product term doing its job. Crank up one kernel's weight and the merge
slides toward it and starts to inherit its shape.

<gaussian-merge-example example="ellipse"></gaussian-merge-example>


