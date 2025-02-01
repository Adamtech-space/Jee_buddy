from manim import *
import traceback

class WhatIsPolyniminalDistributionWithGraphScene(Scene):
    def construct(self):
        try:
            # Title
            title = Text("what is polyniminal distribution with graph", font_size=48)
            self.play(Write(title))
            self.wait(1)  # Wait for 1 second
            self.play(FadeOut(title))

            # Main content with error handling
                        # Title Screen
            title = Text("Polynomial Distribution", font_size=48, color=BLUE)
            subtitle = Text("Understanding the Concept with Graphs", font_size=32, color=WHITE)
            subtitle.next_to(title, DOWN)
            self.play(Write(title), Write(subtitle))
            self.wait(2)
            self.play(FadeOut(title), FadeOut(subtitle))
            # Introduction to Polynomial Distribution
            intro_text = Text("What is Polynomial Distribution?", font_size=36, color=YELLOW)
            self.play(Write(intro_text))
            self.wait(1.5)
            self.play(FadeOut(intro_text))
            # Formula Explanation
            formula = MathTex(
            "P(x) = a_n x^n + a_{n-1} x^{n-1} + \\dots + a_1 x + a_0",
            color=GREEN
            )
            formula_label = Text("General Form of a Polynomial", font_size=28, color=WHITE)
            formula_label.next_to(formula, DOWN)
            self.play(Write(formula), Write(formula_label))
            self.wait(2)
            self.play(FadeOut(formula), FadeOut(formula_label))
            # Graph Visualization
            axes = Axes(
            x_range=[-5, 5, 1],
            y_range=[-10, 10, 2],
            axis_config={"color": BLUE},
            )
            graph_label = Text("Graph of a Polynomial Function", font_size=28, color=WHITE)
            graph_label.to_edge(UP)
            self.play(Create(axes), Write(graph_label))
            self.wait(1)
            # Example Polynomial Graph
            example_poly = axes.plot(lambda x: x**3 - 3*x**2 + 2, color=YELLOW)
            example_label = MathTex("f(x) = x^3 - 3x^2 + 2", color=YELLOW)
            example_label.next_to(example_poly, UP)
            self.play(Create(example_poly), Write(example_label))
            self.wait(2)
            # Counter-Example: Non-Polynomial Function
            counter_example = axes.plot(lambda x: np.sin(x), color=RED)
            counter_label = MathTex("g(x) = \\sin(x)", color=RED)
            counter_label.next_to(counter_example, DOWN)
            self.play(Create(counter_example), Write(counter_label))
            self.wait(2)
            self.play(FadeOut(counter_example), FadeOut(counter_label))
            # Practical Application
            application_text = Text("Practical Applications of Polynomials", font_size=36, color=ORANGE)
            application_text.to_edge(UP)
            self.play(Write(application_text))
            self.wait(1)
            # Example Application: Projectile Motion
            projectile_formula = MathTex(
            "h(t) = -4.9t^2 + v_0 t + h_0",
            color=PURPLE
            )
            projectile_label = Text("Height of a Projectile Over Time", font_size=28, color=WHITE)
            projectile_label.next_to(projectile_formula, DOWN)
            self.play(Write(projectile_formula), Write(projectile_label))
            self.wait(2)
            self.play(FadeOut(projectile_formula), FadeOut(projectile_label))
            # Summary Screen
            summary = Text("Key Points", font_size=48, color=BLUE)
            bullet_points = BulletedList(
            "Polynomials are functions of the form P(x) = a_n x^n + ... + a_0",
            "Graphs of polynomials are smooth curves",
            "Polynomials have wide applications in physics, engineering, and more",
            font_size=32,
            color=WHITE
            )
            bullet_points.next_to(summary, DOWN)
            self.play(Write(summary), Write(bullet_points))
            self.wait(3)
            self.play(FadeOut(summary), FadeOut(bullet_points))
            # End Scene
            end_text = Text("Thank You!", font_size=48, color=GREEN)
            self.play(Write(end_text))
            self.wait(2)
            self.play(FadeOut(end_text))

            self.wait(1)  # Final wait before ending the scene

        except Exception as e:
            # Handle any runtime errors
            error_text = Text(f"Error: {str(e)}", color=RED)
            self.play(Write(error_text))
            self.wait(2)
            logger.error(f"Animation error: {str(e)}")
            logger.error(traceback.format_exc())