from manim import *
import traceback

class PolynominalDistributionWithGraphFormulaForScene(Scene):
    def construct(self):
        try:
            # Title
            title = Text("polynominal distribution with graph formula for", font_size=48)
            self.play(Write(title))
            self.wait(1)  # Wait for 1 second
            self.play(FadeOut(title))

            # Main content with error handling
                        # Title screen
            title = Text("Polynomial Distribution", font_size=48, color=BLUE)
            subtitle = Text("Understanding the Formula and Applications", font_size=32, color=YELLOW)
            subtitle.next_to(title, DOWN)
            self.play(Write(title), Write(subtitle))
            self.wait(2)
            self.play(FadeOut(title), FadeOut(subtitle))
            # Step 1: Introduce the polynomial distribution formula
            formula = MathTex(
            "P(x) = a_n x^n + a_{n-1} x^{n-1} + \\cdots + a_1 x + a_0",
            font_size=40,
            color=GREEN
            )
            formula_label = Text("Polynomial Distribution Formula", font_size=32, color=WHITE)
            formula_label.next_to(formula, UP)
            self.play(Write(formula_label))
            self.play(Write(formula))
            self.wait(2)
            # Step 2: Explain each component of the formula
            a_n = MathTex("a_n", color=RED).next_to(formula[0][2], DOWN)
            x_n = MathTex("x^n", color=BLUE).next_to(formula[0][4], DOWN)
            a_0 = MathTex("a_0", color=RED).next_to(formula[0][-1], DOWN)
            self.play(Write(a_n), Write(x_n), Write(a_0))
            self.wait(2)
            # Step 3: Show a practical example
            example = MathTex(
            "P(x) = 2x^3 - 3x^2 + 4x - 1",
            font_size=40,
            color=GREEN
            )
            example_label = Text("Example Polynomial", font_size=32, color=WHITE)
            example_label.next_to(example, UP)
            self.play(Transform(formula, example), Transform(formula_label, example_label))
            self.wait(2)
            # Step 4: Graph the example polynomial
            axes = Axes(
            x_range=[-3, 3, 1],
            y_range=[-10, 10, 2],
            axis_config={"color": WHITE}
            )
            graph = axes.plot(lambda x: 2*x**3 - 3*x**2 + 4*x - 1, color=YELLOW)
            graph_label = axes.get_graph_label(graph, label="P(x) = 2x^3 - 3x^2 + 4x - 1")
            self.play(Create(axes), Create(graph), Write(graph_label))
            self.wait(2)
            # Step 5: Show a counter-example (non-polynomial)
            counter_example = MathTex(
            "f(x) = \\sin(x)",
            font_size=40,
            color=RED
            )
            counter_example_label = Text("Non-Polynomial Function", font_size=32, color=WHITE)
            counter_example_label.next_to(counter_example, UP)
            self.play(FadeOut(axes), FadeOut(graph), FadeOut(graph_label))
            self.play(Write(counter_example_label), Write(counter_example))
            self.wait(2)
            # Step 6: Summarize key points
            summary = VGroup(
            Text("Key Points:", font_size=40, color=BLUE),
            Text("1. Polynomials are sums of terms with variables raised to powers.", font_size=32, color=WHITE),
            Text("2. The degree of a polynomial is the highest power of x.", font_size=32, color=WHITE),
            Text("3. Polynomials are used in modeling and approximation.", font_size=32, color=WHITE)
            )
            summary.arrange(DOWN, aligned_edge=LEFT)
            self.play(FadeOut(counter_example_label), FadeOut(counter_example))
            self.play(Write(summary))
            self.wait(3)
            # End scene
            self.play(FadeOut(summary))

            self.wait(1)  # Final wait before ending the scene

        except Exception as e:
            # Handle any runtime errors
            error_text = Text(f"Error: {str(e)}", color=RED)
            self.play(Write(error_text))
            self.wait(2)
            logger.error(f"Animation error: {str(e)}")
            logger.error(traceback.format_exc())