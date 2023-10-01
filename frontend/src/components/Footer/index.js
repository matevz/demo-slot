import classes from "./index.module.css"
import footerLogo from './images/footer-logo.svg'

export const Footer = () => {
  return (
    <>
      <div className={classes.footerDivider}/>
      <div className={classes.footer}>
        <div className={classes.footerText}>Copyright © 2023 matevz. All rights reserved.</div>
      </div>
    </>
  );
}
