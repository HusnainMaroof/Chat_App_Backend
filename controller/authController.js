import { UserModel } from "../models/userModel.js";
import otpGenrator from "otp-generator";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { sentOtp } from "../lib/sendOTP.js";
import jwt from "jsonwebtoken";
import { reSetPassowordMail } from "../lib/sendPasswordLink.js";
import cloudinary from "../lib/cloudinary.js";
import { config } from "../config/EnvConfig.js";

import { client as redisClient } from "../config/connectRedis.js";
export const regUser = async (req, res) => {
  const { userName, email, password } = req.body;

  if (!userName || !email || !password) {
    res.status(400);
    throw new Error("User Credentials not provided");
  }

  let checkEmail = await UserModel.findOne({ email });

  if (checkEmail) {
    res.status(409);
    throw new Error("Email already exists");
  }
  let hashPassword = await bcrypt.hash(password, 10);

  let otp = otpGenrator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  });

  const otpExpirtesAt = new Date(Date.now() + 60 * 60 * 1000);

  let createUser = await UserModel.create({
    userName,
    email,
    password: hashPassword,
    otp: { code: otp, expiresAt: otpExpirtesAt },
  });

  sentOtp(email, otp);

  const SignUpSessionID = crypto.randomBytes(32).toString("base64url");

  createUser.signupSession = {
    id: SignUpSessionID,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  };
  let user = await createUser.save();

  res.cookie("signup_session", SignUpSessionID, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "none",
    path: "/",
    maxAge: 10 * 60 * 1000,
  });

  res.send("Registration Done");
};

export const verfiyOtp = async (req, res) => {
  const { otp } = req.body;

  const signUpCookie = req.cookies?.signup_session;
  if (!signUpCookie) {
    res.status(401);
    throw new Error("No_SIGNUP_SESSSION");
  }

  if (!otp) {
    res.status(401);
    throw new Error("OTP IS MISSING_CODE");
  }
  const user = await UserModel.findOne({
    "signupSession.id": signUpCookie,
    "signupSession.expiresAt": { $gt: new Date() },
  });

  if (!user) {
    res.status(401);
    throw new Error("SESSION_EXPIRED");
  }

  const now = Date.now();
  if (!user?.otp?.code || user?.otp?.expiresAt <= now) {
    res.status(401);
    throw new Error("OTP_EXPIRED");
  }

  let correctOtp = String(otp).trim();

  if (!user?.otp?.code === correctOtp) {
    res.status(401);
    throw new Error("INVALID_OTP");
  }

  user.isVerified = true;
  user.signupSession.id = undefined;
  user.signupSession.expiresAt = undefined;
  user.otp.expiresAt = undefined;
  user.otp.code = undefined;
  let response = await user.save();
  res.clearCookie("signup_session", {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "none",
    path: "/",
  });

  const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
    expiresIn: "7d",
  });
  const expiresIn = 7 * 24 * 60 * 60 * 1000;

  res.cookie("auth_cookie", token, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "none",
    path: "/",
    maxAge: expiresIn,
  });

  res.send({
    userId: response._id,
    userName: response.userName,
    email: response.email,
    profileVerified: response.profileVerified,
    isVerified: response.isVerified,
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  await new Promise((resolve) => setTimeout(resolve, 5000));
  let getUser = await UserModel.findOne({ email });

  if (!getUser) {
    res.status(404);
    throw new Error("invalid Credentials");
  }

  if (getUser?.email !== email) {
    res.status(401);
    throw new Error("Invalid Email");
  }

  let checkPass = await bcrypt.compare(password, getUser?.password);

  if (!checkPass) {
    res.status(401);
    throw new Error("Invalid pass");
  }

  const expiresIn = 7 * 24 * 60 * 60 * 1000;
  let tooken = jwt.sign({ id: getUser?._id }, config.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("auth_cookie", tooken, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "none",
    path: "/",
    maxAge: expiresIn,
  });
  res.status(200);
  res.send("user login Successfully");
};

export const reSendOtp = async (req, res) => {
  const SignUpSessionID = req.cookies?.signup_session;

  if (!SignUpSessionID) {
    res.status(401);
    throw new Error("NO_SIGNUP_SESSION");
  }

  let getUser = await UserModel.findOne({
    "signupSession.id": SignUpSessionID,
    "signupSession.expiresAt": { $gt: new Date() },
  });

  if (!getUser) {
    res.status(401);
    throw new Error("SESSION_EXPIRED");
  }

  getUser.otp.code = null;
  getUser.otp.expiresAt = null;
  getUser.signupSession.expiresAt = null;
  getUser.signupSession.id = null;

  let newotp = otpGenrator.generate(4, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  });

  const newExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const NewSignUpSessionID = crypto.randomBytes(32).toString("base64url");
  sentOtp(getUser?.email, newotp);
  getUser.otp.code = newotp;
  getUser.otp.expiresAt = newExpiresAt;
  getUser.signupSession.id = NewSignUpSessionID;

  let newUser = await getUser.save();
  res.cookie("signup_session", NewSignUpSessionID, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "none",
    path: "/",
    maxAge: newExpiresAt,
  });

  res.send("Otp Resend Successfully");
};

export const ReSetPassowrdLink = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(404);
    throw new Error("Email not provided");
  }
  const getUser = await UserModel.findOne({ email });
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (!getUser) {
    res.status(404);
    throw new Error("user not Exsited");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const newExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  getUser.resetPassword.id = resetToken;
  getUser.resetPassword.expiresAt = newExpiresAt;
  let newUser = await getUser.save();
  let link = `${config.FRONTEND_ORIGIN}/reset-password/${resetToken}`;

  reSetPassowordMail(email, link);
  res.send({ link: "link sended" });
};

export const ReSetPassword = async (req, res) => {
  let Link = req.params.Link;
  const { newPassword } = req.body;

  if (!newPassword) {
    res.status(400);
    throw new Error("new Password in not provided");
  }
  if (!Link) {
    res.status(400);
    throw new Error("new Link in not provided");
  }

  let findUser = await UserModel.findOne({
    "resetPassword.id": Link,
    "resetPassword.expiresAt": { $gt: new Date() },
  });

  if (!findUser) {
    res.status(401);
    throw new Error("INVALID_TOKEN OR TOEKN EXPIRED");
  }
  let hash = await bcrypt.hash(newPassword, 10);
  findUser.password = hash;
  findUser.resetPassword.expiresAt = null;
  findUser.resetPassword.id = null;
  let newUser = await findUser.save();

  res.send("password has been ReSet");
};

export const getCacheKey = (userId) => `user:profile:${userId}`;

export const updateProfile = async (req, res) => {
  const { user } = req?.user;
  const { bio, country, profilePhoto } = req.body;

  if (!bio || !country || !profilePhoto) {
    res.status(400);
    throw new Error("All fields (bio, country, profilePhoto) are required");
  }

  let image_url;
  if (profilePhoto) {
    try {
      const upload = await cloudinary.uploader.upload(profilePhoto);
      image_url = upload.secure_url;
    } catch (error) {
      console.log(error);
      res.status(400);
      throw new Error("file uploading Error");
    }
  }
  let updatedUser;

  try {
    updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      { country, bio, profilePhoto: image_url, profileVerified: true },
      { new: true },
    );
  } catch (error) {
    res.status(400);
    throw new Error("Db updating Error");
  }

  try {
    await redisClient.del(getCacheKey(user._id));
  } catch (error) {
    res.status(400);
    throw new Error("Error while deleting cash user after updating the user ");
  }

  res.send("profile updated");
};

export const logout = async (req, res) => {
  let cookieBase = {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: "none",
    path: "/",
  };

  res.clearCookie("auth_cookie", cookieBase);

  res.send("logout");
};

export const auth_Me = async (req, res) => {
  const { user } = req?.user;

  res.json({
    userId: user._id,
    userName: user?.userName,
    email: user?.email,
    country: user?.country,
    bio: user?.bio,
    isVerified: user?.isVerified,
    profileVerified: user?.profileVerified,
    profilePhoto: user?.profilePhoto,
  });
};
