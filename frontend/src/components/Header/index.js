import classes from "./index.module.css"
import logo from "../../images/logo.svg"
import githubLink from "./images/github-mark.svg"
import wallet from "./images/wallet.svg"
import {Button} from "../Button";
import {useWeb3} from "../../providers/Web3Provider";
import {ErrorMessage} from "../ErrorMessage";
import {ethers} from "ethers";

export const Header = () => {
  const {connectWallet, addSapphireNetworkToMetamask, state} = useWeb3()
  const {isMetamaskInstalled, networkError, selectedAddress, maxReward, ticketPrice} = state;

  const navigateToMetamask = () => {
    window.open("https://metamask.io/download/");
  }

  return (
    <header className={classes.header}>
      <div className={classes.logoContainer}>
        <a className={classes.githubLink} target="_blank" rel="noopener noreferrer" href="https://github.com/matevz/demo-slot">
          <img src={githubLink} alt="GitHub source"/>
        </a>
      </div>
      <div className={classes.headerContent}>
        <div className={classes.headerContentLeft}>
          <h1 className={classes.headerTitle}>WHEEL<br/> OF FORTUNE</h1>
          {ticketPrice!==undefined && maxReward!==undefined && <>
              < h2 className={classes.headerSubTitle}>
            Ticket price only {ethers.utils.formatEther(ticketPrice)} tokens!<br/>
            Win {ethers.utils.formatEther(maxReward)} tokens!
            </h2>
              </>
          }
          {!isMetamaskInstalled && <>
            <Button onClick={navigateToMetamask}>
              <>
                <img src={wallet} alt="Wallet"/>
                <span>Install MetaMask</span>
              </>
            </Button>
            <h2 className={[classes.headerSubTitle, classes.headerSubTitleSmall].join(' ')}>
              Copy the URL in the MetaMask browser
            </h2>
          </>
          }
          {isMetamaskInstalled && !selectedAddress &&
            <>
              <Button onClick={connectWallet}>
                <>
                  <img src={wallet} alt="Wallet"/>
                  <span>Connect Wallet</span>
                </>
              </Button>
              <br/>
              <br/>
              <Button onClick={addSapphireNetworkToMetamask}>
                Add network
              </Button>
              <br/>
              <br/>
              {networkError && <ErrorMessage className={classes.errorMessage}>{networkError}</ErrorMessage>}
              <br/>
            </>
          }
          {selectedAddress && <Button disabled className={classes.connected} showArrow={false}>
            Connected
          </Button>}
        </div>
        <div className={classes.headerContentRightDesktop}></div>
        <div className={classes.headerContentRightMobile}>
          <div className={classes.headerContentRight}></div>
        </div>
      </div>
    </header>
  )
}
