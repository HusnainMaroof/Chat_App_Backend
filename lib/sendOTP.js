import nodemailer from "nodemailer"
import { config } from "../config/EnvConfig.js"



export const sentOtp = (email, otp) => {

  let transpotar = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "husnainmaroof95@gmail.com",
      pass: config.EMAIL.PASS
    }
  })


  let option = {
    subject: `OTP Verification`,
    from: 'husnainmaroof95@gmail.com',
    to: email,
    html: `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your email - BaatCheet</title>
    <style>
      /* Mobile tweaks */
      @media (max-width:600px){
        .container{width:100%!important; max-width:100%!important; border-radius:0!important}
        .p-40{padding:24px!important}
        .p-32{padding:20px!important}
        /* Mobile OTP styling */
        .otp{font-size:26px!important; letter-spacing:8px!important; padding:12px 20px!important}
      }
      /* Avoid iOS auto-styling phone numbers, dates, etc. */
      a[x-apple-data-detectors]{color:inherit!important; text-decoration:none!important}
      /* Dark-mode friendly text colors in some clients */
      :root{color-scheme:light dark; supported-color-schemes:light dark}
    </style>
  </head>
  <!-- Main dark background body -->
  <body style="margin:0; padding:0; background:#0F172A; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; color:#E2E8F0;">
    
    <!-- Preheader (hidden) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
      Your BaatCheet verification code is ${otp}. It expires in 10 minutes.
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="center" style="padding:32px 16px;">
          
          <!-- Card Container -->
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" 
            style="width:600px; max-width:600px; background:#1E293B; border-radius:16px; box-shadow:0 8px 30px rgba(0,200,255,0.15); overflow:hidden;">
            
            <!-- HERO SECTION (Indigo/Cyan Gradient) -->
            <tr>
              <td class="p-40" 
                style="padding:40px; 
                       background:#06B6D4; 
                       background-image:linear-gradient(135deg, #4F46E5, #06B6D4); 
                       color:#ffffff;">
                <!--[if mso]>
                  <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:auto;">
                    <v:fill color="#4F46E5" />
                    <v:textbox inset="40px,40px,40px,40px">
                <![endif]-->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="left" style="font-weight:900; font-size:28px; letter-spacing:-0.01em;">
                      BaatCheet
                    </td>
                  </tr>
                  
                  <tr>
                    <td align="left" style="padding-top:8px; font-size:16px; color:rgba(255,255,255,0.95);">
                      Use the code below to complete your sign-up process.
                    </td>
                  </tr>
                </table>
                <!--[if mso]></v:textbox></v:rect><![endif]-->
              </td>
            </tr>

            <!-- OTP SECTION -->
            <tr>
              <td class="p-32" style="padding:48px 32px; background:#1F2937;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <!-- Label text (lighter gray) -->
                    <td align="center" style="font-size:14px; color:#94A3B8; font-weight:600; padding-bottom:12px;">
                      Your one-time code
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <!-- OTP pill with new gradient and shadow -->
                      <div class="otp" style="
                        display:inline-block;
                        background: linear-gradient(135deg, #0EA5E9, #6366F1);
                        color:#ffffff;
                        padding:16px 28px;
                        border-radius:16px;
                        box-shadow:0 8px 24px rgba(0,200,255,0.20);
                        font-size:34px;
                        font-weight:900;
                        letter-spacing:12px;
                        text-align:center;
                        font-family: Menlo, Consolas, 'Courier New', monospace;">
                        ${otp}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <!-- Expiration notice -->
                    <td align="center" style="padding-top:24px; font-size:14px; color:#94A3B8;">
                      This code expires in <strong>10 minutes</strong>. If you didn’t request it, you can safely ignore this email.
                    </td>
                  </tr>

                  <!-- Help -->
                  <tr>
                    <td align="center" style="padding-top:32px; font-size:12px; color:#64748B;">
                      <span style="display:block; padding-bottom:8px;">If you are having trouble, copy and paste this link into your browser:</span>
                      <span style="word-break:break-all; color:#06B6D4;">{{VERIFY_URL}}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding:20px; font-size:13px; color:#64748B; background:#1E293B; border-top:1px solid #334155; text-align:center;">
                BaatCheet — Don’t share your code.
                &nbsp;•&nbsp;
                <a href="{www.google.com}" style="color:#06B6D4; text-decoration:none;">Contact support</a>
              </td>
            </tr>
          </table>
          <!-- /Card Container -->

        </td>
      </tr>
    </table>
  </body>
</html>`
  }



  let main = transpotar.sendMail(option, (err, info) => {

    try {
      console.log("email Sended");

    } catch (error) {
      console.log(err);
      console.log(error);

    }
  })

}

