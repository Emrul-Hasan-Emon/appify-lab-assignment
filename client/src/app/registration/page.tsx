"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, register } from "@/lib/api";
import { saveSession } from "@/lib/session";

export default function RegistrationPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { accessToken, user } = await register({
        firstName,
        lastName,
        email,
        password,
      });
      saveSession(accessToken, user);
      router.push("/feed");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/*Registration Section Start*/}
      <section className="_social_registration_wrapper _layout_main_wrapper">
        <div className="_shape_one">
          <img src="/assets/images/shape1.svg" alt="" className="_shape_img" />
          <img
            src="/assets/images/dark_shape.svg"
            alt=""
            className="_dark_shape"
          />
        </div>
        <div className="_shape_two">
          <img src="/assets/images/shape2.svg" alt="" className="_shape_img" />
          <img
            src="/assets/images/dark_shape1.svg"
            alt=""
            className="_dark_shape _dark_shape_opacity"
          />
        </div>
        <div className="_shape_three">
          <img src="/assets/images/shape3.svg" alt="" className="_shape_img" />
          <img
            src="/assets/images/dark_shape2.svg"
            alt=""
            className="_dark_shape _dark_shape_opacity"
          />
        </div>
        <div className="_social_registration_wrap">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
                <div className="_social_registration_right">
                  <div className="_social_registration_right_image">
                    <img src="/assets/images/registration.png" alt="Image" />
                  </div>
                  <div className="_social_registration_right_image_dark">
                    <img src="/assets/images/registration1.png" alt="Image" />
                  </div>
                </div>
              </div>
              <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
                <div className="_social_registration_content">
                  <div className="_social_registration_right_logo _mar_b28">
                    <img
                      src="/assets/images/logo.svg"
                      alt="Image"
                      className="_right_logo"
                    />
                  </div>
                  <p className="_social_registration_content_para _mar_b8">
                    Get Started Now
                  </p>
                  <h4 className="_social_registration_content_title _titl4 _mar_b50">
                    Registration
                  </h4>
                  <button
                    type="button"
                    className="_social_registration_content_btn _mar_b40"
                  >
                    <img
                      src="/assets/images/google.svg"
                      alt="Image"
                      className="_google_img"
                    />{" "}
                    <span>Register with google</span>
                  </button>
                  <div className="_social_registration_content_bottom_txt _mar_b40">
                    {" "}
                    <span>Or</span>
                  </div>
                  {error && (
                    <div className="_mar_b14" style={{ color: "#dc3545" }}>
                      {error}
                    </div>
                  )}
                  <form
                    className="_social_registration_form"
                    onSubmit={handleSubmit}
                  >
                    <div className="row">
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <div className="_social_registration_form_input _mar_b14">
                          <label className="_social_registration_label _mar_b8">
                            First Name
                          </label>
                          <input
                            type="text"
                            className="form-control _social_registration_input"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <div className="_social_registration_form_input _mar_b14">
                          <label className="_social_registration_label _mar_b8">
                            Last Name
                          </label>
                          <input
                            type="text"
                            className="form-control _social_registration_input"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <div className="_social_registration_form_input _mar_b14">
                          <label className="_social_registration_label _mar_b8">
                            Email
                          </label>
                          <input
                            type="email"
                            className="form-control _social_registration_input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <div className="_social_registration_form_input _mar_b14">
                          <label className="_social_registration_label _mar_b8">
                            Password
                          </label>
                          <input
                            type="password"
                            className="form-control _social_registration_input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                      <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                        <div className="_social_registration_form_input _mar_b14">
                          <label className="_social_registration_label _mar_b8">
                            Repeat Password
                          </label>
                          <input
                            type="password"
                            className="form-control _social_registration_input"
                            value={repeatPassword}
                            onChange={(e) => setRepeatPassword(e.target.value)}
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
                        <div className="form-check _social_registration_form_check">
                          <input
                            className="form-check-input _social_registration_form_check_input"
                            type="radio"
                            name="flexRadioDefault"
                            id="flexRadioDefault2"
                            defaultChecked
                          />
                          <label
                            className="form-check-label _social_registration_form_check_label"
                            htmlFor="flexRadioDefault2"
                          >
                            I agree to terms & conditions
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                        <div className="_social_registration_form_btn _mar_t40 _mar_b60">
                          <button
                            type="submit"
                            className="_social_registration_form_btn_link _btn1"
                            disabled={loading}
                          >
                            {loading ? "Creating account..." : "Register now"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                  <div className="row">
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                      <div className="_social_registration_bottom_txt">
                        <p className="_social_registration_bottom_txt_para">
                          Already have an account? <a href="/login">Login</a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/*Registration Section End*/}
    </>
  );
}
