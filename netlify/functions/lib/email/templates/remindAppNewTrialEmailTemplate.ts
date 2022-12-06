export const remindAppNewTrialEmailTemplateBody = `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
<div style="margin:50px auto;width:70%;padding:20px 0">
  <p style="font-size:1.1em">Hello {{contactName}}</p>
  <p>First off, thanks for signing up for Reminder App! My name is Murtaza and I'm the creator of this app. I'm excited to have you on board and I'm here to help you get started 🤗</p>
  <p>Hopefully you've had a chance to install this app on your Rocket.Chat workspace and play around a bit. If you haven't, no worries. Take a look at our docs over <a href="https://add-reminders.gitbook.io/docs"> here to get started</a>.
</p>
  <p> Next, I'll walk you through on how to activate all the premium features of the Reminder app on your workspace with this setup guide.</p>
  <h3>License Setup Guide</h3>
  <ol type="1">
	<li>Login to your Rocket.Chat server - <a href="{{workspaceAddress}}">{{workspaceAddress}}</a></li>
	<li>Goto Apps Setting (<i>Administration</i> -> <i>Apps</i> -> Click on <i>Add Reminder</i>)</li>
	<li>Once you're on the app setting page, there locate the <i>Premium License</i> Setting and there add the license key (you should find this license key within this email). Then just click on Save Settings and that's it. Your License has now been activated</li>
	<li>(Optional) To verify if the license is set, just try out any Premium features like creating more than 5 reminders or sending reminders to channels or users</li>
  </ol>
  <h3>Premium License key</h3>
<table cellpadding="0" cellspacing="0" style="background: pink;">
	  <tr>
		<td style="background: pink; color: #000; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; font-size: 13px; padding: 10px 15px;">
			<pre style="-moz-tab-size: 2; -ms-hyphens: none; -o-tab-size: 2; -webkit-hyphens: none; color: #000; font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace; font-size: 13px; hyphens: none; line-height: 1.5; overflow: auto; tab-size: 2; text-align: left; white-space: pre; word-break: break-all; word-spacing: normal; word-wrap: normal;">{{license}}</pre>
		</td>
	</tr>
</table>
  <br/> 
  <div style="border-bottom:1px solid #eee">
	</div>
  <p> I hope you find the app useful. <b>Your trial will expire at {{trialExpiry}} </b>. If you wish to continue using Reminder App's premium features after the trial, you can purchase a license from <a href="{{purchaseLink}}"> our website</a>.</p>
  <p>
	If you have any questions at all, you can reply directly to this email, or send me a message at <a href="mailto: contact@appsforchat.com">contact@appsforchat.com</a> any time and I’ll be happy to assist you! 
    </p>
  <p style="font-size:0.9em;">Regards,<br />Murtaza Patrawala<br /> <a href="www.linkedin.com/in/murtaza-p
">LinkedIn</a> </p>
  <hr style="border:none;border-top:1px solid #eee" />
</div>
</div>`;

export const remindAppNewTrialEmailTemplateSubject = `Welcome! Getting started with Reminder App for Rocket.Chat`;
