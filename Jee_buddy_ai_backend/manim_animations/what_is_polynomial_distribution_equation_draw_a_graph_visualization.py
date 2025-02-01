from manim import *
import traceback

class WhatIsPolynomialDistributionEquationDrawAGraphScene(Scene):
    def construct(self):
        try:
            # Title
            title = Text("what is polynomial distribution equation draw a graph", font_size=48)
            self.play(Write(title))
            self.wait(1)  # Wait for 1 second
            self.play(FadeOut(title))

            # Main content with error handling
                        # Title Screen
            title = Text("Polynomial Distribution Equation", font_size=48, color=BLUE)
            subtitle = Text("Understanding the Basics", font_size=32, color=YELLOW)
            subtitle.next_to(title, DOWN)
            self.play(Write(title), Write(subtitle))
            self.wait(2)
            self.play(FadeOut(title), FadeOut(subtitle))
            # Introduction to Polynomial Distribution
            intro_text = Text("Polynomial Distribution describes the probability of outcomes in a multi-category experiment.", font_size=32)
            intro_text.to_edge(UP)
            self.play(Write(intro_text))
            self.wait(2)
            # Formula Explanation
            formula = MathTex(
            "P(X_1 = x_1, X_2 = x_2, \\dots, X_k = x_k) = \\frac{n!}{x_1! x_2! \\dots x_k!} p_1^{x_1} p_2^{x_2} \\dots p_k^{x_k}",
            font_size=36
            )
            formula.next_to(intro_text, DOWN)
            self.play(Write(formula))
            self.wait(3)
            # Graph Visualization
            axes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 1, 0.1],
            axis_config={"color": BLUE},
            x_axis_config={"numbers_to_include": np.arange(0, 11, 1)},
            y_axis_config={"numbers_to_include": np.arange(0, 1.1, 0.1)},
            )
            axes_labels = axes.get_axis_labels(x_label="x", y_label="P(x)")
            graph = axes.plot(lambda x: 0.1 * x**2 - 0.5 * x + 0.6, color=YELLOW)
            graph_label = axes.get_graph_label(graph, label="P(x) = 0.1x^2 - 0.5x + 0.6")
            self.play(Create(axes), Write(axes_labels))
            self.play(Create(graph), Write(graph_label))
            self.wait(3)
            # Practical Application Example
            example_text = Text("Example: Rolling a die multiple times", font_size=32)
            example_text.to_edge(UP)
            self.play(Transform(intro_text, example_text))
            self.wait(2)
            example_formula = MathTex(
            "P(X_1 = 1, X_2 = 2, \\dots, X_6 = 6) = \\frac{10!}{1! 2! \\dots 6!} \\left(\\frac{1}{6}\\right)^{10}",
            font_size=36
            )
            example_formula.next_to(example_text, DOWN)
            self.play(Transform(formula, example_formula))
            self.wait(3)
            # Summary Screen
            summary_text = Text("Key Points:", font_size=40, color=GREEN)
            key_points = BulletedList(
            "Polynomial Distribution models multi-category experiments.",
            "The formula involves factorials and probabilities.",
            "Graphs help visualize the distribution.",
            font_size=32
            )
            key_points.next_to(summary_text, DOWN)
            self.play(Write(summary_text), Write(key_points))
            self.wait(4)
            # Fade Out
            self.play(FadeOut(summary_text), FadeOut(key_points), FadeOut(axes), FadeOut(graph), FadeOut(graph_label))
            self.wait(1)

            self.wait(1)  # Final wait before ending the scene

        except Exception as e:
            # Handle any runtime errors
            error_text = Text(f"Error: {str(e)}", color=RED)
            self.play(Write(error_text))
            self.wait(2)
            logger.error(f"Animation error: {str(e)}")
            logger.error(traceback.format_exc())