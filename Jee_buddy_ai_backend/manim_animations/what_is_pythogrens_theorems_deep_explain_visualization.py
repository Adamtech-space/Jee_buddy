from manim import *
import traceback

class WhatIsPythogrensTheoremsDeepExplainScene(Scene):
    def construct(self):
        try:
            # Title
            title = Text("what is pythogrens theorems deep explain", font_size=48)
            self.play(Write(title))
            self.wait(1)  # Wait for 1 second
            self.play(FadeOut(title))

            # Main content with error handling
                        # Title Screen
            title = Text("Pythagorean Theorem", font_size=48, color=BLUE)
            subtitle = Text("A Deep Explanation", font_size=32, color=YELLOW)
            subtitle.next_to(title, DOWN)
            self.play(Write(title), Write(subtitle))
            self.wait(2)
            self.play(FadeOut(title), FadeOut(subtitle))
            # Initial Statement of the Theorem
            theorem_statement = MathTex(
            r"a^2 + b^2 = c^2",
            font_size=48,
            color=GREEN
            )
            theorem_label = Text("Pythagorean Theorem", font_size=32, color=BLUE)
            theorem_label.next_to(theorem_statement, DOWN)
            self.play(Write(theorem_statement), Write(theorem_label))
            self.wait(2)
            self.play(FadeOut(theorem_statement), FadeOut(theorem_label))
            # Visual Proof with Right Triangle
            triangle = Polygon(
            ORIGIN, RIGHT * 3, UP * 4,
            color=WHITE
            )
            triangle_labels = VGroup(
            MathTex("a", font_size=24).next_to(triangle.get_vertices()[1], DOWN),
            MathTex("b", font_size=24).next_to(triangle.get_vertices()[2], LEFT),
            MathTex("c", font_size=24).next_to(triangle.get_center(), RIGHT * 1.5 + UP * 1.5)
            )
            self.play(Create(triangle), Write(triangle_labels))
            self.wait(1)
            # Squares on Each Side
            square_a = Square(side_length=3, color=BLUE).next_to(triangle.get_vertices()[1], DOWN)
            square_b = Square(side_length=4, color=RED).next_to(triangle.get_vertices()[2], LEFT)
            square_c = Square(side_length=5, color=GREEN).move_to(triangle.get_center() + RIGHT * 1.5 + UP * 1.5)
            self.play(Create(square_a), Create(square_b), Create(square_c))
            self.wait(1)
            # Area Calculation
            area_a = MathTex(r"a^2 = 9", font_size=24, color=BLUE).next_to(square_a, DOWN)
            area_b = MathTex(r"b^2 = 16", font_size=24, color=RED).next_to(square_b, LEFT)
            area_c = MathTex(r"c^2 = 25", font_size=24, color=GREEN).next_to(square_c, UP)
            self.play(Write(area_a), Write(area_b), Write(area_c))
            self.wait(2)
            # Sum of Areas
            sum_areas = MathTex(
            r"a^2 + b^2 = c^2",
            r"\Rightarrow 9 + 16 = 25",
            font_size=32,
            color=YELLOW
            ).to_edge(DOWN)
            self.play(Write(sum_areas))
            self.wait(2)
            # Practical Application
            application_text = Text("Practical Application: Finding the Hypotenuse", font_size=32, color=BLUE)
            application_example = MathTex(
            r"a = 6,\ b = 8 \Rightarrow c = \sqrt{6^2 + 8^2} = 10",
            font_size=32,
            color=GREEN
            ).next_to(application_text, DOWN)
            self.play(Write(application_text), Write(application_example))
            self.wait(2)
            # Summary Screen
            summary = VGroup(
            Text("Key Points:", font_size=32, color=BLUE),
            Text("1. Pythagorean Theorem: a² + b² = c²", font_size=24, color=WHITE),
            Text("2. Applies to right triangles", font_size=24, color=WHITE),
            Text("3. Used to find missing side lengths", font_size=24, color=WHITE)
            ).arrange(DOWN, aligned_edge=LEFT).to_edge(UP)
            self.play(FadeIn(summary))
            self.wait(3)

            self.wait(1)  # Final wait before ending the scene

        except Exception as e:
            # Handle any runtime errors
            error_text = Text(f"Error: {str(e)}", color=RED)
            self.play(Write(error_text))
            self.wait(2)
            logger.error(f"Animation error: {str(e)}")
            logger.error(traceback.format_exc())