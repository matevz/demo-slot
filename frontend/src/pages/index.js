import {Header} from "../components/Header";
import {Wheel} from "../components/Wheel";
import {useWeb3} from "../providers/Web3Provider";
import {useEffect} from "react";
import {Footer} from "../components/Footer";
import {InfoBanner} from "../components/InfoBanner";

export const LandingPage = () => {
  const {init} = useWeb3()

  useEffect(() => {
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <Header/>
      <Wheel/>
      <InfoBanner />
      <Footer />
    </>
  )
}
