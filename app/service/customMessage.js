module.exports = {

    "COMMON_MESSAGE": {
        "WELCOME": {
            success: true,
            message: "Welcome to Nazara Loyalty-API!",
            messageCode: "WELCOME",
            statusCode: 200
        },
        "ERROR": {
            success: false,
            message: "Something went wrong! Please try again.",
            messageCode: "ERROR",
            statusCode: 500
        },
        "DB_ERROR": {
            success: false,
            message: "Something went wrong! Please try again.",
            messageCode: "DB_ERROR",
            statusCode: 500
        },
        "VALIDATION_FAILED": {
            success: false,
            message: "Validation failed! Please provide the valid input details.",
            messageCode: "VALIDATION_FAILED",
            statusCode: 412
        },
        "INVALID_APP_SECRET_KEY": {
            success: false,
            message: "Invalid App Secret Key!",
            messageCode: "INVALID_APP_SECRET_KEY",
            statusCode: 401
        },
        "INVALID_ACCESS_TOKEN": {
            success: false,
            message: "Invalid Access Token!",
            messageCode: "INVALID_ACCESS_TOKEN",
            statusCode: 401
        }
    },


    //LOGIN/REGISTER MODULES
    "LOGIN_MESSAGE": {

        "USER_ALREADY_REGISTERD": {
            success: false,
            message: "User Alerady Registered",
            messageCode: "ALREADY_REGISTERD",
            statusCode: 401
        },
        "USER_REGISTERED_SUCCESS": {
            success: true,
            message: "Registered Successfully.",
            messageCode: "REGISTERED_SUCCESS",
            statusCode: 200
        },
        "USER_DEACTIVE": {
            success: false,
            message: "Your account is De-Active! Please contact to your Admin to activate it.",
            messageCode: "USER_DEACTIVE",
            statusCode: 401
        },
        "USER_PENDING": {
            success: false,
            message: "Your account is not verified. Please verify your account using verification link sent on your Email Id!",
            messageCode: "USER_PENDING",
            statusCode: 401
        },
        "USER_VERIFIED": {
            success: false,
            message: "Your account is not activated by Admin. Please contact to your Admin to activate it.",
            messageCode: "USER_PENDING",
            statusCode: 401
        },
        "EMAIL_VERIFIED_SUCCESS": {
            success: true,
            message: "Email verified succefully. Admin will Approve your account shortly.",
            messageCode: "USER_PENDING",
            statusCode: 200
        },
        "USER_REJECTED": {
            success: false,
            message: "Your account is rejected by Admin. Please contact to your Admin for more details.",
            messageCode: "USER_PENDING",
            statusCode: 401
        },
        "EMAIL_ALREADY_VERIFIED": {
            success: false,
            message: "Email Id already verified. Admin will Approve your account shortly!",
            messageCode: "EMAIL_ALREADY_VERIFIED",
            statusCode: 401
        },
        "USER_ALREADY_ACTIVE": {
            success: false,
            message: "Email Id already verified. Please login with your credentials!",
            messageCode: "USER_ALREADY_ACTIVE",
            statusCode: 401
        },
        "LOGIN_SUCCESS": {
            success: true,
            message: "Logged in successfully!",
            messageCode: "LOGIN_SUCCESS",
            statusCode: 200
        },
        "LOGIN_FAILED": {
            success: false,
            message: "Invalid Email Id or Password!",
            messageCode: "LOGIN_FAILED",
            statusCode: 401
        },
        "PASSWORD_LINK_SENT": {
            success: true,
            message: "Password reset link sent on your Email Id!",
            messageCode: "PASSWORD_LINK_SENT",
            statusCode: 200
        },
        "PASSWORD_LINK_FAILED": {
            success: false,
            message: "Password reset link failed! Please try again.",
            messageCode: "PASSWORD_LINK_FAILED",
            statusCode: 401
        },
        "INVALID_EMAIL": {
            success: false,
            message: "Invalid Email Id! Please provide valid Email Id.",
            messageCode: "INVALID_EMAIL",
            statusCode: 401
        },
        "EMAIL_VERIFICATION_FAILED": {
            success: false,
            message: "Email verification failed!. Please try again.",
            messageCode: "EMAIL_VERIFICATION_FAILED",
            statusCode: 401
        },
        "INVALID_VERIFICATION_CODE": {
            success: false,
            message: "Invalid verification code!",
            messageCode: "INVALID_VERIFICATION_CODE",
            statusCode: 401
        },
        "ACCOUNT_NOT_ACTIVE": {
            success: false,
            message: "Your account not active to reset password!",
            messageCode: "ACCOUNT_NOT_ACTIVE",
            statusCode: 401
        },
        "PWD_RESET_SUCCESS": {
            success: true,
            message: "Password changed successfully! Please login with your credentials.",
            messageCode: "PWD_RESET_SUCCESS",
            statusCode: 200
        },
        "PWD_RESET_FAILED": {
            success: false,
            message: "Failed to reset password! Please try again.",
            messageCode: "PWD_RESET_FAILED",
            statusCode: 401
        },
        "INVALID_CONFIRMATION_CODE": {
            success: false,
            message: "Invalid confirmation code!",
            messageCode: "INVALID_CONFIRMATION_CODE",
            statusCode: 401
        },
    },

    "MASTER_MESSAGE": {
        "REGISTERED_SUCCESS": {
            success: true,
            message: "Added successfully!",
            messageCode: "REGISTERED_SUCCESS",
            statusCode: 200
        },
        "ALREADY_REGISTERED": {
            success: false,
            message: "Already exists!",
            messageCode: "ALREADY_REGISTERED",
            statusCode: 401
        },
        "FAILED_REGISTERED": {
            success: false,
            message: "Failed to add!",
            messageCode: "FAILED_REGISTERED",
            statusCode: 401
        },
        "ADD_SUCCESS": {
            success: true,
            message: "Added successfully!",
            messageCode: "ADD_SUCCESS",
            statusCode: 200
        },
        "ALREADY_ADDED": {
            success: false,
            message: "Already exists!",
            messageCode: "ALREADY_ADDED",
            statusCode: 401
        },
        "ADD_FAILED": {
            success: false,
            message: "Failed to Add!",
            messageCode: "ADD_FAILED",
            statusCode: 401
        },
        "UPDATE_SUCCESS": {
            success: true,
            message: "Updated successfully!",
            messageCode: "UPDATED_SUCCESS",
            statusCode: 200
        },
        "UPDATE_FAILED": {
            success: false,
            message: "Failed to update!",
            messageCode: "UPADTE_FAILED",
            statusCode: 401
        },
        "GET_SUCCESS": {
            success: true,
            message: "Details found!",
            messageCode: "GET_SUCCESS",
            statusCode: 200
        },
        "EXECUTED": {
            success: true,
            message: "Executed Successfully!",
            messageCode: "EXECUTED",
            statusCode: 200
        },
        "GET_FAILED": {
            success: false,
            message: "Failed to find details!",
            messageCode: "GET_FAILED",
            statusCode: 401
        },
        "NO_DATA_FOUND": {
            success: false,
            message: "No data available",
            messageCode: "NO_DATA_FOUND",
            statusCode: 401
        },
        "REMOVE_SUCCESS": {
            success: true,
            message: "Details Removed!",
            messageCode: "REMOVE_SUCCESS",
            statusCode: 200
        },
        "REMOVE_FAILED": {
            success: false,
            message: "Failed to Remove details!",
            messageCode: "REMOVE_FAILED",
            statusCode: 401
        },
        "LEVEL_EXIST": {
            success: false,
            message: "Level Already exists",
            messageCode: "LEVEL_EXIST",
            statusCode: 401
        },
        "TXN_SUCCESS": {
            success: true,
            message: "Transaction Success!",
            messageCode: "TXN_SUCCESS",
            statusCode: 200
        },
        "TXN_FAILED": {
            success: false,
            message: "Transaction Failed!",
            messageCode: "TXN_FAILED",
            statusCode: 401
        }
    },
    "BULKSMS_MESSAGE": {
        "FILE_IMPORT": {
            success: true,
            message: "File Imported Successfully",
            messageCode: "FILE_IMPORTED",
            statusCode: 200
        },
        "WRONG_HEADER": {
            success: false,
            message: "File should have column - phone_number",
            messageCode: "FILE_IMPORTED",
            statusCode: 401
        }
    },
    "CONTEST_MESSAGE": {
        "IS_UPCOMING_FALSE": {
            success: false,
            message: "Please select only upcoming contest",
            messageCode: "IS_UPCOMING_FALSE",
            statusCode: 401
        },
        "CONTEST_UPDATED": {
            success: true,
            message: "CONTEST_UPDATED",
            messageCode: "CONTEST_UPDATED",
            statusCode: 200
        },
    },
    "Rebuild_Cache": {
        "on_failed": {
            success: false,
            message: "Something went worng..",
            messageCode: "on_failed",
            statusCode: 401
        },
        "on_success": {
            success: true,
            message: "cache rebuild successfully",
            messageCode: "on_success",
            statusCode: 200
        },
    },
    "runContestCron": {
        "on_failed": {
            success: false,
            message: "No Contest to Insert",
            messageCode: "on_failed",
            statusCode: 401
        },
        "on_success": {
            success: true,
            message: " Contests Inserted",
            messageCode: "on_success",
            statusCode: 200
        },
    },
    "insertRankM": {
        "on_failed": {
            success: false,
            message: "No Ranks to Insert",
            messageCode: "on_failed",
            statusCode: 401
        },
        "on_success": {
            success: true,
            message: " Contests Ranks Inserted",
            messageCode: "on_success",
            statusCode: 200
        },
    }

}