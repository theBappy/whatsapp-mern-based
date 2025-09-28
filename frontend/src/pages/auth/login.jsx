import React, { useState } from "react";
import { useLoginStore } from "../../store/use-login-store";
import countries from "../../utils/countries";

const UserLogin = () => {
  const { step, setStep, userPhoneData, resetLoginState } = useLoginStore();
  const [phoneNumber, setPhoneNumber] = useState("")
  const [selectedCountry, setSelectedCountry] = useState(countries[0])
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  

  return <div>

  </div>;
};

export default UserLogin;
