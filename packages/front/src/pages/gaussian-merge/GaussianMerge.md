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

In the example below, **Gaussian A** and **Gaussian B** are drawn as ellipses
(the solid contour is one <latex-math inline>\sigma</latex-math>, the faint one is two),
and the dark dashed ellipse is their moment-matched merge. Each kernel has its own
widths, rotation, and weight. Notice how the merged ellipse not only sits at the
weighted midpoint but also *elongates* along the line joining A and B — that is
the outer-product term doing its job. Crank up one kernel's weight and the merge
slides toward it and starts to inherit its shape.

<gaussian-merge-example example="ellipse"></gaussian-merge-example>


