import classes from "./index.module.css"
import {InfoMessage} from "../InfoMessage";
import {Button} from "../Button";
import {CTAWithIcon} from "../CTAWithIcon";
import berlin from "./images/berlin.svg";
import {LocationLink} from "../LocationLink";

export const InfoBanner = () => {
  const navigateToClaimYourSpot = () => {
    window.open("https://www.dappcon.io/livestream");
  }

  return (
    <>
      <div className={classes.infoBanner}>
      </div>
    </>
  )
}
