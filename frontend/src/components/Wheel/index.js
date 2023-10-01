import {useEffect, useState} from "react";
import wheel from './images/wheel.png'
import wheelOuter from './images/wheel-outer.svg'
import wheelSpinText from './images/wheel-spin-text.svg'
import wheelSpinFailedText from './images/wheel-failed-text.svg'
import wheelSpinWonCircle from './images/wheel-spin-won-circle.svg'
import classes from "./index.module.css"
import {useWeb3} from "../../providers/Web3Provider";
import {InfoMessage} from "../InfoMessage";
import {ErrorMessage} from "../ErrorMessage";
import {Button} from "../Button";
import {Spinner} from "../Spinner";
import {LocationLink} from "../LocationLink";
import {ethers} from "ethers";

export const Wheel = () => {
  const {
    draw,
    state: {selectedAddress, networkError, slot, contractAddressToken, swagTokenId, drawError, maxReward, wonReward}
  } = useWeb3()
  const [spin, setSpin] = useState(false)

  const startSpin = () => {
    if (spin || !selectedAddress) {
      return
    }

    draw()
    setSpin(true)
  }

  const endSpin = () => {
    setSpin(false)
  }

  useEffect(() => {
    if (slot || networkError) {
      endSpin()
    }
  }, [slot, networkError])

  return (<div className={classes.wheelContainer}>
    <div className={classes.wheel}>
      <img draggable={false}
           className={[classes.wheelOuter, ...[spin ? [classes.animateOuter] : []]].join(' ')}
           src={wheelOuter} alt="Wheel lines"/>
      <img draggable={false} className={[classes.wheelInner, ...[spin ? [classes.animateInner] : []]].join(' ')}
           src={wheel}
           alt="Wheel"/>

      {selectedAddress && maxReward && !networkError && <img onClick={startSpin} draggable={false}
                                                         className={[classes.wheelText, ...[spin ? [classes.fadeOut] : [classes.fadeIn]]].join(' ')}
                                                         src={wheelSpinText} alt="Click to spin"/>}
      {selectedAddress && networkError && <img draggable={false}
                                               className={[classes.wheelText, classes.fadeIn].join(' ')}
                                               src={wheelSpinFailedText} alt="failed."/>}

    </div>
    {selectedAddress && <>
      { slot==="won" && <>
        <InfoMessage>🎉 Congratulations, you won {ethers.utils.formatEther(wonReward)}! 🎉</InfoMessage>
        <p className={classes.collectMessage}>🪙 Tokens are already on the way to {selectedAddress} 🪙</p>
        <p className={classes.collectMessage}>❤️ Want to try one more time? ❤️</p>
      </>
      }
      { slot==="lose" && <>
        <InfoMessage>😉 Better luck next time! 😉</InfoMessage>
        <p className={classes.collectMessage}>❤️ Want to try one more time? ❤️</p>
      </>
      }
      {drawError && <ErrorMessage>Something went wrong! Try again!</ErrorMessage>}
    </>}
    {selectedAddress && (slot==="won" || slot==="lose") && <>
      <InfoMessage pointer onClick={() => startSpin()}>Spin the wheel again</InfoMessage>
      <ErrorMessage>{networkError}</ErrorMessage>
    </>
    }
  </div>)
}
