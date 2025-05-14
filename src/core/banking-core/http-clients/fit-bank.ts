import ky from "ky";

export const bankClient = ky.create({
  prefixUrl: "https://api.fitbank.com",
  throwHttpErrors: false,
});



