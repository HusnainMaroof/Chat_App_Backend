import { error } from "console"
import nodemailer from "nodemailer"
import { config } from "../config/EnvConfig.js"


export const reSetPassowordMail = (email, link) => {



    let transpotar = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "husnainmaroof95@gmail.com",
            pass: config.EMAIL.PASS
        }
    })


    let option = {
        subject: "Your Password Reset Token (Valid for 1 hour)",
        from: "husnainmaroof95@gmail.com",
        to: email,
        html: `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset - Talkei</title>
    <style>
      /* Mobile tweaks */
      @media (max-width:600px){
        .container{width:100%!important; max-width:100%!important; border-radius:0!important}
        .p-40{padding:24px!important}
        .p-32{padding:20px!important}
        .btn{padding:14px 18px!important} /* Mobile button padding */
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
      Click the link to securely reset your Talkei password.
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
                      Talkei
                    </td>
                  </tr>
                  
                  <tr>
                    <td align="left" style="padding-top:8px; font-size:16px; color:rgba(255,255,255,0.95);">
                      You requested a password reset. Click the button below to continue.
                    </td>
                  </tr>
                </table>
                <!--[if mso]></v:textbox></v:rect><![endif]-->
              </td>
            </tr>

            <!-- MAIN RESET SECTION -->
            <tr>
              <td class="p-32" style="padding:48px 32px; background:#1F2937;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  
                  <tr>
                    <!-- Main text body -->
                    <td align="center" style="font-size:16px; color:#E2E8F0; line-height:1.6; padding-bottom:32px;">
                      If you initiated this password reset request, please click the button below to set a new password for your Talkei account.
                    </td>
                  </tr>
                  
                  <tr>
                    <td align="center">
                      <!-- RESET BUTTON (VML fallback for Outlook) -->
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:auto;">
                        <tr>
                          <td style="border-radius:12px; 
                                     background: linear-gradient(135deg, #0EA5E9, #6366F1); 
                                     box-shadow:0 8px 24px rgba(0,200,255,0.20); 
                                     text-align:center;">
                            <!--[if mso]>
                              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{RESET_URL}}" style="height:56px;v-text-anchor:middle;width:240px;" arcsize="20%" stroke="f" fillcolor="#6366F1">
                                <w:anchorlock/>
                                <center style="color:#ffffff;font-family:sans-serif;font-size:18px;font-weight:700;">
                                  Reset Password
                                </center>
                              </v:roundrect>
                            <![endif]-->
                            <a href="${link}" 
                              target="_blank" 
                              style="font-size:18px; 
                                     font-weight:700; 
                                     color:#ffffff; 
                                     text-decoration:none; 
                                     border-radius:12px; 
                                     padding:16px 30px; 
                                     display:inline-block; 
                                     font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;
                                     mso-hide:all;">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <tr>
                    <!-- Security Notice -->
                    <td align="center" style="padding-top:40px; font-size:14px; color:#94A3B8;">
                      If you did not request a password reset, please ignore this email. 
                      Your password will remain unchanged.
                    </td>
                  </tr>

                  <!-- Help -->
                  <tr>
                    <td align="center" style="padding-top:32px; font-size:12px; color:#64748B;">
                      <span style="display:block; padding-bottom:8px;">If the button above doesn't work, copy and paste this link into your browser:</span>
                      <span style="word-break:break-all; color:#06B6D4;">{{RESET_URL}}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td style="padding:20px; font-size:13px; color:#64748B; background:#1E293B; border-top:1px solid #334155; text-align:center;">
                Talkei — For your security, this link will expire shortly.
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
            console.log(`Reset Emial sended `);

        } catch (error) {
            console.log(err);
            console.log(error);


        }
    })
}