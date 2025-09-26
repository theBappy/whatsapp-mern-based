import twilio from "twilio";

// twilio credentials from env
const accountSid = process.env.TWILLO_ACCOUNT_SID;
const authToken = process.env.TWILLO_AUTH_TOKEN;
const serviceSid = process.env.TWILLO_SERVICE_SID;

const client = twilio(accountSid, authToken);

// send OTP to phone number
export const sendOtpToPhoneNumber = async (phoneNumber) => {
  try {
    console.log(`Sending otp to this number ${phoneNumber}`);
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }
    const response = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: phoneNumber,
        channel: "sms",
      });
    console.log(`This is my OTP response`, response);
    return response;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to send OTP");
  }
};

export const verifyOtp = async (phoneNumber, otp) => {
  try {
    console.log(`This is otp`, otp);
    console.lo(`This is phone number`, phoneNumber);
    const response = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp,
      });
    console.log(`This is verify OTP response`, response);
    return response;
  } catch (error) {
    console.error(error);
    throw new Error("OTP verification failed");
  }
};
