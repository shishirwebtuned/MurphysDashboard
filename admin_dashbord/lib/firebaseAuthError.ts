function formatAuthMessage(message: string) {
  switch (message) {
    case "INVALID_LOGIN_CREDENTIALS":
      return "Current password is incorrect";

    case "EMAIL_NOT_FOUND":
      return "No account found with this email";

    case "USER_DISABLED":
      return "This account has been disabled";

    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "Too many attempts. Please try again later";

    default:
      return message.replace(/_/g, " ").toLowerCase();
  }
}
export { formatAuthMessage };