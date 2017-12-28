import React, { Component } from 'react'
import ChainDoctorHubContract from '../build/contracts/ChainDoctorHub.json'
import ChainDoctorRemittanceContract from '../build/contracts/ChainDoctorRemittance.json'

import getWeb3 from './utils/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      storageValue: 0,
      instance:{},
      openCreateNewRemittance:false,
      openSetupRemittance:false,
      statusMessage:"",
      chainDoctorRemittanceCount:0,
      deadLineInSeconds_Submit:10,
      setupRemittance_doctorAddress:"0xf17f52151EbEF6C7334FAD080c5704D77216b732",
      setupRemittance_deposit:50,
      setupRemittance_appointmentValue:10,
      setupRemittance_contractAddress:"0xe4324920dbcbaa6e250d7926d5b45119519962c7",
      account:"",
      web3: null
    }

    this.createNewRemittance          = this.createNewRemittance.bind(this);
    this.setupRemittanceProcess          = this.setupRemittanceProcess.bind(this);    
    this.createChainDoctorRemittance  = this.createChainDoctorRemittance.bind(this);
    this.createNewChainDoctorRemittanceProcess  = this.createNewChainDoctorRemittanceProcess.bind(this);
    
    

    
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })

      // Instantiate contract once web3 provided.
      this.instantiateContract()
    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  instantiateContract() {
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */

    const contract = require('truffle-contract')
    const chainDoctorHub = contract(ChainDoctorHubContract)
    chainDoctorHub.setProvider(this.state.web3.currentProvider)

    // Declaring this for later so we can chain functions on SimpleStorage.
    var chainDoctorHubInstance;
    var acc;

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      chainDoctorHub.deployed().then((instance) => {
        chainDoctorHubInstance = instance;
        acc = accounts[0];
        return chainDoctorHubInstance.getChainDoctorRemittanceCount( {from: acc} )
      }).then((result) => {
        console.log(result.toNumber());
        this.setState({ chainDoctorRemittanceCount: result.toNumber() });
        this.setState({ instance: chainDoctorHubInstance });
        this.setState({ account:  acc});
      })
    })
  }

  createNewRemittance(event){
    event.preventDefault(); 
    this.setState({openCreateNewRemittance:true});
    this.setState({openSetupRemittance:false});
    this.setState({statusMessage:""});      
  }

  setupRemittanceProcess(event){
    event.preventDefault();
    this.setState({openSetupRemittance:true});  
    this.setState({openCreateNewRemittance:false}); 
    this.setState({statusMessage:""});  
  }

  createNewChainDoctorRemittanceProcess(event){
    event.preventDefault();
    this.setState({statusMessage:""});  
    var deposit = this.state.setupRemittance_deposit;
    var doctorAddress = this.state.setupRemittance_doctorAddress;
    var appointmentValue = this.state.setupRemittance_appointmentValue;
    var remittanceContractAddress = this.state.setupRemittance_contractAddress;
    var self = this;

    if(deposit<=0){
      this.setState({statusMessage: "Error setting deposit. Value must be greater than zero."});
      return;
    }

    if(appointmentValue<=0){
      this.setState({statusMessage: "Error setting appointment value. Value must be greater than zero."});
      return;
    }


    const contract = require('truffle-contract')
    const remittanceContract = contract(ChainDoctorRemittanceContract);  //city hall



    remittanceContract.setProvider(this.state.web3.currentProvider);

console.log(contract);
    console.log(remittanceContract);
    console.log();
    

    return remittanceContract.at(remittanceContractAddress)
            .then(instance=>{
                console.log(instance);
                instance.createNewChainDoctorRemittanceProcess(doctorAddress, appointmentValue, {from: this.state.account, value:deposit, gas: 4000000} )
                .then(tx=> {
                  console.log(tx);
                  console.log(tx.logs[0].args);             
                }).catch(function(e) {
                    console.log(e);
                    self.setState({statusMessage: "Error setting up Remittance."});
                  }) 
            }).catch(function(e) {
                console.log(e);
                self.setState({statusMessage: "Error setting up Remittance Process."});
            }) 
  }
  

  createChainDoctorRemittance(event){
    event.preventDefault();
    this.setState({statusMessage:""});  
    var deadline = this.state.deadLineInSeconds_Submit;
    var self = this;

    if(deadline<=0){
      this.setState({statusMessage: "Error setting deadline. Value must be greater than zero."});
      return;
    }

    return this.state.instance.createChainDoctorRemittance(10 , {from: this.state.account})
            .then(tx => {
              console.log(tx.logs[0].args);             
            }).catch(function(e) {
                console.log(e);
                self.setState({statusMessage: "Error creating Remittance."});
              })   
  }

  render() {

    let SetupRemittance = (this.state.openSetupRemittance )? (  
                <div>
                  <h3>Setup Chain Doctor Remittance.</h3>
                  <form onSubmit={this.createNewChainDoctorRemittanceProcess}>
                    <label>
                    Remittance contract address:
                    <input placeholder="0x125479695..." value={this.state.setupRemittance_contractAddress} onChange={e => this.setState({ setupRemittance_contractAddress: e.target.value })}/>
                    </label>
                    <br />

                    <label>
                    Doctor account address:
                    <input placeholder="0x234254545..." value={this.state.setupRemittance_doctorAddress} onChange={e => this.setState({ setupRemittance_doctorAddress: e.target.value })}/>
                    </label>
                    <br />

                    <label>
                    Appointment value (in Wei):
                    <input placeholder="10" value={this.state.setupRemittance_appointmentValue} onChange={e => this.setState({ setupRemittance_appointmentValue: e.target.value })}/>
                    </label>
                    <br />

                    <label>
                    Deposit (in Wei):
                    <input placeholder="1000" value={this.state.setupRemittance_deposit} onChange={e => this.setState({ setupRemittance_deposit: e.target.value })}/>
                    </label>
                    <br />                                                     
                    <button type="submit"> Setup </button>
                  </form>                                                    
                </div>)
                 : 
              (<div></div>) 

    let CreateNewRemittanceForm = (this.state.openCreateNewRemittance )? (  
                <div>
                  <h3>Start a new Chain Doctor Remittance instance.</h3>
                  <form onSubmit={this.createChainDoctorRemittance}> 
                    <label>
                    Deadline (in seconds - 16000000 is 6 months):
                    <input placeholder="16000000" value={this.state.deadLineInSeconds_Submit} onChange={e => this.setState({ deadLineInSeconds_Submit: e.target.value })}/>
                    </label>                                                    
                    <button type="submit"> Create </button>
                  </form>                                                    
                </div>)
                 : 
              (<div></div>) 

    return (
      <div className="App">



        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link"></a>
        </nav>



        <main className="container">
          <div className="pure-g">
            <div>
              <img src="logo.png" alt="Smiley face" height="82" width="82" />
            </div>
            <div className="pure-u-1-1">
              <h1>Welcome to Chain Doctor!</h1>
              <p>Use buttons bellow to navigate.</p>
              <p>System has {this.state.chainDoctorRemittanceCount} Remittances deployed </p>
              {this.state.statusMessage}
              <br /> <br />
              <form onSubmit={this.createNewRemittance}>                       
                      <button type="submit"> Create a new Chain Doctor Remittance </button>
              </form>
              <br /> <br />
              <form onSubmit={this.setupRemittanceProcess}>                       
                      <button type="submit"> Setup Chain Doctor Remittance (add doctor address to receive payment)</button>
              </form>

            </div>
          </div>
          <div>{CreateNewRemittanceForm}</div>
          <div>{SetupRemittance}</div>
          
        </main>
      </div>






    );
  }
}

export default App
