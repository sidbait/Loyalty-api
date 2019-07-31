module.exports = {

    "COMMON_MESSAGE": {
        "WELCOME": {
            success: 1,
            message: "Welcome to Nazara Loyalty-API!",
            messageCode: "WELCOME",
            statusCode: 200
        },
        "ERROR": {
            success: 0,
            message: "Something went wrong! Please try again.",
            messageCode: "ERROR",
            statusCode: 500
        },
        "DB_ERROR": {
            success: 0,
            message: "Something went wrong! Please try again.",
            messageCode: "DB_ERROR",
            statusCode: 500
        },
        "VALIDATION_FAILED": {
            success: 0,
            message: "Validation failed! Please provide the valid input details.",
            messageCode: "VALIDATION_FAILED",
            statusCode: 412
        },
        "INVALID_APP_SECRET_KEY": {
            success: 0,
            message: "Invalid App Secret Key!",
            messageCode: "INVALID_APP_SECRET_KEY",
            statusCode: 401
        },
        "INVALID_ACCESS_TOKEN": {
            success: 0,
            message: "Invalid Access Token!",
            messageCode: "INVALID_ACCESS_TOKEN",
            statusCode: 401
        },
        "INSUFFICIENT_BALANCE": {
            success: 0,
            message: "Insufficient Balance in Wallet",
            messageCode: "INSUFFICIENT_BALANCE",
            statusCode: 400
        },
        "CONTEST_ENDED": {
            success: 0,
            message: "Reward Contest has been ended",
            messageCode: "CONTEST_ENDED",
            statusCode: 400
        }
    },


    //LOGIN/REGISTER MODULES
    "LOGIN_MESSAGE": {

        "USER_ALREADY_REGISTERD": {
            success: 0,
            message: "User Alerady Registered",
            messageCode: "ALREADY_REGISTERD",
            statusCode: 401
        },
        "USER_REGISTERED_SUCCESS": {
            success: 1,
            message: "Registered Successfully.",
            messageCode: "REGISTERED_SUCCESS",
            statusCode: 200
        },
        "INVALID_OTP": {
            success: 0,
            message: "Invalid Otp",
            messageCode: "INVALID_OTP",
            statusCode: 401
        },
        "OTP_SUCCESS": {
            success: 1,
            message: "OTP login successfully",
            messageCode: "OTP_SUCCESS",
            statusCode: 200
        },
        "USER_DEACTIVE": {
            success: 0,
            message: "Your account is De-Active! Please contact to your Admin to activate it.",
            messageCode: "USER_DEACTIVE",
            statusCode: 401
        },
        "USER_PENDING": {
            success: 0,
            message: "Your account is not verified. Please verify your account using verification link sent on your Email Id!",
            messageCode: "USER_PENDING",
            statusCode: 401
        },
        "USER_VERIFIED": {
            success: 0,
            message: "Your account is not activated by Admin. Please contact to your Admin to activate it.",
            messageCode: "USER_PENDING",
            statusCode: 401
        },
        "EMAIL_VERIFIED_SUCCESS": {
            success: 1,
            message: "Email verified succefully. Admin will Approve your account shortly.",
            messageCode: "USER_PENDING",
            statusCode: 200
        },
        "USER_REJECTED": {
            success: 0,
            message: "Your account is rejected by Admin. Please contact to your Admin for more details.",
            messageCode: "USER_PENDING",
            statusCode: 401
        },
        "EMAIL_ALREADY_VERIFIED": {
            success: 0,
            message: "Email Id already verified. Admin will Approve your account shortly!",
            messageCode: "EMAIL_ALREADY_VERIFIED",
            statusCode: 401
        },
        "USER_ALREADY_ACTIVE": {
            success: 0,
            message: "Email Id already verified. Please login with your credentials!",
            messageCode: "USER_ALREADY_ACTIVE",
            statusCode: 401
        },
        "LOGIN_SUCCESS": {
            success: 1,
            message: "Logged in successfully!",
            messageCode: "LOGIN_SUCCESS",
            statusCode: 200
        },
        "LOGIN_FAILED": {
            success: 0,
            message: "Invalid Email Id or Password!",
            messageCode: "LOGIN_FAILED",
            statusCode: 401
        },
        "PASSWORD_LINK_SENT": {
            success: 1,
            message: "Password reset link sent on your Email Id!",
            messageCode: "PASSWORD_LINK_SENT",
            statusCode: 200
        },
        "PASSWORD_LINK_FAILED": {
            success: 0,
            message: "Password reset link failed! Please try again.",
            messageCode: "PASSWORD_LINK_FAILED",
            statusCode: 401
        },
        "INVALID_EMAIL": {
            success: 0,
            message: "Invalid Email Id! Please provide valid Email Id.",
            messageCode: "INVALID_EMAIL",
            statusCode: 401
        },
        "EMAIL_VERIFICATION_FAILED": {
            success: 0,
            message: "Email verification failed!. Please try again.",
            messageCode: "EMAIL_VERIFICATION_FAILED",
            statusCode: 401
        },
        "INVALID_VERIFICATION_CODE": {
            success: 0,
            message: "Invalid verification code!",
            messageCode: "INVALID_VERIFICATION_CODE",
            statusCode: 401
        },
        "ACCOUNT_NOT_ACTIVE": {
            success: 0,
            message: "Your account not active to reset password!",
            messageCode: "ACCOUNT_NOT_ACTIVE",
            statusCode: 401
        },
        "PWD_RESET_SUCCESS": {
            success: 1,
            message: "Password changed successfully! Please login with your credentials.",
            messageCode: "PWD_RESET_SUCCESS",
            statusCode: 200
        },
        "PWD_RESET_FAILED": {
            success: 0,
            message: "Failed to reset password! Please try again.",
            messageCode: "PWD_RESET_FAILED",
            statusCode: 401
        },
        "INVALID_CONFIRMATION_CODE": {
            success: 0,
            message: "Invalid confirmation code!",
            messageCode: "INVALID_CONFIRMATION_CODE",
            statusCode: 401
        },
    },

    "MASTER_MESSAGE": {
        "REGISTERED_SUCCESS": {
            success: 1,
            message: "Added successfully!",
            messageCode: "REGISTERED_SUCCESS",
            statusCode: 200
        },
        "ALREADY_REGISTERED": {
            success: 0,
            message: "Already exists!",
            messageCode: "ALREADY_REGISTERED",
            statusCode: 401
        },
        "FAILED_REGISTERED": {
            success: 0,
            message: "Failed to add!",
            messageCode: "FAILED_REGISTERED",
            statusCode: 401
        },
        "ADD_SUCCESS": {
            success: 1,
            message: "Added successfully!",
            messageCode: "ADD_SUCCESS",
            statusCode: 200
        },
        "ALREADY_ADDED": {
            success: 0,
            message: "Already exists!",
            messageCode: "ALREADY_ADDED",
            statusCode: 401
        },
        "ADD_FAILED": {
            success: 0,
            message: "Failed to Add!",
            messageCode: "ADD_FAILED",
            statusCode: 401
        },
        "UPDATE_SUCCESS": {
            success: 1,
            message: "Updated successfully!",
            messageCode: "UPDATED_SUCCESS",
            statusCode: 200
        },
        "UPDATE_FAILED": {
            success: 0,
            message: "Failed to update!",
            messageCode: "UPADTE_FAILED",
            statusCode: 401
        },
        "GET_SUCCESS": {
            success: 1,
            message: "Details found!",
            messageCode: "GET_SUCCESS",
            statusCode: 200
        },
        "EXECUTED": {
            success: 1,
            message: "Executed Successfully!",
            messageCode: "EXECUTED",
            statusCode: 200
        },
        "GET_FAILED": {
            success: 0,
            message: "Failed to find details!",
            messageCode: "GET_FAILED",
            statusCode: 401
        },
        "NO_DATA_FOUND": {
            success: 0,
            message: "No data available",
            messageCode: "NO_DATA_FOUND",
            statusCode: 401
        },
        "REMOVE_SUCCESS": {
            success: 1,
            message: "Details Removed!",
            messageCode: "REMOVE_SUCCESS",
            statusCode: 200
        },
        "REMOVE_FAILED": {
            success: 0,
            message: "Failed to Remove details!",
            messageCode: "REMOVE_FAILED",
            statusCode: 401
        },
        "LEVEL_EXIST": {
            success: 0,
            message: "Level Already exists",
            messageCode: "LEVEL_EXIST",
            statusCode: 401
        },
        "TXN_SUCCESS": {
            success: 1,
            message: "Transaction Success!",
            messageCode: "TXN_SUCCESS",
            statusCode: 200
        },
        "TXN_FAILED": {
            success: 0,
            message: "Transaction Failed!",
            messageCode: "TXN_FAILED",
            statusCode: 401
        },
        "IN_PROCESS": {
            success: 1,
            message: "Request is in process!",
            messageCode: "IN_PROCESS",
            statusCode: 200
        }
    },
    "BULKSMS_MESSAGE": {
        "FILE_IMPORT": {
            success: 1,
            message: "File Imported Successfully",
            messageCode: "FILE_IMPORTED",
            statusCode: 200
        },
        "WRONG_HEADER": {
            success: 0,
            message: "File should have column - phone_number",
            messageCode: "FILE_IMPORTED",
            statusCode: 401
        }
    },
    "CONTEST_MESSAGE": {
        "IS_UPCOMING_FALSE": {
            success: 0,
            message: "Please select only upcoming contest",
            messageCode: "IS_UPCOMING_FALSE",
            statusCode: 401
        },
        "CONTEST_UPDATED": {
            success: 1,
            message: "CONTEST_UPDATED",
            messageCode: "CONTEST_UPDATED",
            statusCode: 200
        },
    },
    "Rebuild_Cache": {
        "on_failed": {
            success: 0,
            message: "Something went worng..",
            messageCode: "on_failed",
            statusCode: 401
        },
        "on_success": {
            success: 1,
            message: "cache rebuild successfully",
            messageCode: "on_success",
            statusCode: 200
        },
    },
    "runContestCron": {
        "on_failed": {
            success: 0,
            message: "No Contest to Insert",
            messageCode: "on_failed",
            statusCode: 401
        },
        "on_success": {
            success: 1,
            message: " Contests Inserted",
            messageCode: "on_success",
            statusCode: 200
        },
    },
    "insertRankM": {
        "on_failed": {
            success: 0,
            message: "No Ranks to Insert",
            messageCode: "on_failed",
            statusCode: 401
        },
        "on_success": {
            success: 1,
            message: " Contests Ranks Inserted",
            messageCode: "on_success",
            statusCode: 200
        },
    }

}