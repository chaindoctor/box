import React, { Component } from 'react'
import QrReader from 'react-qr-reader'
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
      instanceRemittance:{},
      remittanceBalance:0,
      accountBalance:0,
      openCreateNewRemittance:false,
      openSetupRemittance:false,
      openPayAppointment:false,
      openWithdraw:false,
      statusMessage:"",
      chainDoctorRemittanceCount:0,
      deadLineInSeconds_Submit:10,
      setupRemittance_doctorAddress:"",
      setupRemittance_deposit:50,
      setupRemittance_appointmentValue:10,
      setupRemittance_contractAddress:"",
      qrcode_Submit:"",
      cityHallAddress_Submit:"",
      account:"",
      delay: 300,
      result: 'No result',
      userBalance:"",
      web3: null
    }

    this.createNewRemittance              = this.createNewRemittance.bind(this);
    this.setupRemittanceProcess           = this.setupRemittanceProcess.bind(this);    
    this.createChainDoctorRemittance      = this.createChainDoctorRemittance.bind(this);
    this.createNewChainDoctorRemittanceProcess  = this.createNewChainDoctorRemittanceProcess.bind(this);
    this.openPayAppointmentForm           = this.openPayAppointmentForm.bind(this);
    this.payDoctor                        = this.payDoctor.bind(this);
    this.openWithdrawForm                 = this.openWithdrawForm.bind(this);
    this.releaseRemittance                = this.releaseRemittance.bind(this);
    

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
        this.setState({ chainDoctorRemittanceCount: result.toNumber() });
        this.setState({ instance: chainDoctorHubInstance });
        this.setState({ account:  acc});
        
        this.state.web3.eth.getBalance(acc,(e,balance) => {
          var et = this.state.web3.fromWei(balance, 'ether')  
          this.setState({userBalance:et.toString(10)});
        });        
      })
    })
  }

  createNewRemittance(event){
    event.preventDefault(); 
    this.setState({openCreateNewRemittance:true});
    this.setState({openSetupRemittance:false});
    this.setState({openPayAppointment:false});
    this.setState({openWithdraw:false});
    
    this.setState({statusMessage:""});      
  }

  setupRemittanceProcess(event){
    event.preventDefault();
    this.setState({openSetupRemittance:true});  
    this.setState({openCreateNewRemittance:false});
    this.setState({openPayAppointment:false});
    this.setState({openWithdraw:false}); 
    this.setState({statusMessage:""});  
  }

  openPayAppointmentForm(event){
    event.preventDefault();
    this.setState({openPayAppointment:true}); 
    this.setState({openSetupRemittance:false});  
    this.setState({openCreateNewRemittance:false}); 
    this.setState({openWithdraw:false});
    this.setState({statusMessage:""});
  }

  openWithdrawForm(event){
    event.preventDefault();
    this.setState({openWithdraw:true});
    this.setState({openPayAppointment:false}); 
    this.setState({openSetupRemittance:false});  
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

    console.log(remittanceContract);

    return remittanceContract.at(remittanceContractAddress)
            .then(instance=>{
                console.log(instance);
                instance.createNewChainDoctorRemittanceProcess(doctorAddress, appointmentValue, {from: this.state.account, value:deposit, gas: 4000000} )
                .then(tx=> {
                  console.log(tx);
                  self.setState({statusMessage: "SUCCESS. Chain Doctor Remittance Process started."});                  
                })
                .catch(function(e) {
                    console.log(e);
                    self.setState({statusMessage: "Error setting up Remittance."});
                  })                
            })
            .then(tx=>{
                    self.state.web3.eth.getBalance(self.state.account,(e,balance) => { 
                      var et = self.state.web3.fromWei(balance, 'ether')  
                      self.setState({userBalance:et.toString(10)}); 
                    });
                })
            .catch(function(e) {
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
              
              self.state.web3.eth.getBalance(self.state.account,(e,balance) => {
                  const et = self.state.web3.fromWei(balance, 'ether')  
                  self.setState({userBalance:et.toString(10)});   
              });

              self.setState({statusMessage: "SUCCESS. A new Chain Doctor Remittance was created. Address: " + tx.logs[0].args.chainDoctorRemittance});

            }).catch(function(e) {
                console.log(e);
                self.setState({statusMessage: "Error creating Remittance."});
              })   
  }

  payDoctor(event){
    event.preventDefault();
    this.setState({statusMessage:""});  
    var qrCode = this.state.qrcode_Submit;

    var remittanceContractAddress = this.state.cityHallAddress_Submit;
    var self = this;

    const contract = require('truffle-contract')
    const remittanceContract = contract(ChainDoctorRemittanceContract);  //city hall

    remittanceContract.setProvider(this.state.web3.currentProvider);

    console.log(remittanceContract);

    return remittanceContract.at(remittanceContractAddress)
            .then(instance=>{
                console.log(instance);
                instance.payDoctor(qrCode, {from: this.state.account, gas: 4000000} )
                .then(tx=> {
                  console.log(tx.logs[0].args);
                  console.log(tx.logs[0].args.remittanceBalance.toString(10));
                  console.log(tx.logs[0].args.doctorBalance.toString(10));
                  self.setState({statusMessage: "SUCCESS. Appointment is registered and paid. Doctor's balance: "+ tx.logs[0].args.remittanceBalance.toString(10) + ". Amount left: "+ tx.logs[0].args.doctorBalance.toString(10)});
                  self.state.web3.eth.getBalance(self.state.account,(e,balance) => { 
                    var et = self.state.web3.fromWei(balance, 'ether')  
                    self.setState({userBalance:et.toString(10)}); 
                  }); 
                  self.setState({instanceRemittance:instance });      
                }).catch(function(e) {
                    console.log(e);
                    self.setState({statusMessage: "Error setting up Remittance."});
                  }) 
            }).catch(function(e) {
                console.log(e);
                self.setState({statusMessage: "Error setting up Remittance Process."});
            })

  }

  releaseRemittance(event){
    event.preventDefault();
    this.setState({statusMessage:""});  
    
    var self = this;
   
    console.log(this.state.instanceRemittance);

    return this.state.instanceRemittance.releaseRemittance( {from: this.state.account , gas: 4000000} )
            .then(tx => {
              self.state.web3.eth.getBalance(self.state.account,(e,balance) => {
                    const et = self.state.web3.fromWei(balance, 'ether')  
                    self.setState({userBalance:et.toString(10)});   
              }); 
              self.setState({statusMessage: "SUCCESS. "+tx.logs[0].args.amount+" Wei withdrawn."}); 
              console.log(tx.logs[0].args); 
              console.log(tx.logs[0].args);          
              console.log(tx.logs[0].args);
              console.log(tx.logs[0].args);
              console.log(tx.logs[0].args);
            }).catch(function(e) {
                console.log(e);
                self.setState({statusMessage: "Error creating Remittance."});
              })  
  }

  render() {

    let SetupRemittance = (this.state.openSetupRemittance )? (  
                <div>                
                  <form className="pure-form pure-form-stacked" onSubmit={this.createNewChainDoctorRemittanceProcess}>
                    <fieldset>
                        <legend>Setup Chain Doctor Remittance.</legend>
                        <div className="pure-control-group">
                            <label>
                            Remittance contract address:
                            <input placeholder="0x125479695..." value={this.state.setupRemittance_contractAddress} onChange={e => this.setState({ setupRemittance_contractAddress: e.target.value })}/>
                            </label>
                        </div>

                        <div className="pure-control-group">
                            <label>
                            Doctor account address:
                            <input placeholder="0x234254545..." value={this.state.setupRemittance_doctorAddress} onChange={e => this.setState({ setupRemittance_doctorAddress: e.target.value })}/>
                            </label>
                        </div>

                        <div className="pure-control-group">
                            <label>
                            Appointment value (in Wei):
                            <input placeholder="10" value={this.state.setupRemittance_appointmentValue} onChange={e => this.setState({ setupRemittance_appointmentValue: e.target.value })}/>
                            </label>
                        </div>

                        <div className="pure-control-group">
                            <label>
                            Deposit (in Wei):
                            <input placeholder="1000" value={this.state.setupRemittance_deposit} onChange={e => this.setState({ setupRemittance_deposit: e.target.value })}/>
                            </label>
                        </div>

                        <div className="pure-controls">
                            <button type="submit" className="pure-button pure-button-primary"> Setup </button>
                        </div>
                    </fieldset>
                </form>

                                                                    
                </div>)
                 : 
              (<div></div>) 

    let CreateNewRemittanceForm = (this.state.openCreateNewRemittance )? (  
                <div>
                  <form className="pure-form pure-form-stacked" onSubmit={this.createChainDoctorRemittance}>
                      <fieldset>
                          <legend>Start a new Chain Doctor Remittance instance.</legend>
                          <label >Deadline (in seconds):</label>
                          <input placeholder="16000000" value={this.state.deadLineInSeconds_Submit} onChange={e => this.setState({ deadLineInSeconds_Submit: e.target.value })}/>
                          <span className="pure-form-message">This is a required field.</span>
                          <button type="submit" className="pure-button pure-button-primary"> Create </button>
                      </fieldset>
                  </form>

                </div>)
                 : 
              (<div></div>) 

    let PayAppointmentForm = (this.state.openPayAppointment )? (  
                <div>
                  <form className="pure-form pure-form-stacked" onSubmit={this.payDoctor}>
                      <fieldset>
                          <legend>Register appointment</legend>
                          <label >Chain Doctor Contract address:</label>
                          <input placeholder="" value={this.state.cityHallAddress_Submit} onChange={e => this.setState({ cityHallAddress_Submit: e.target.value })}/>

                          <label >QR Code:</label>
                          <input placeholder="" value={this.state.qrcode_Submit} onChange={e => this.setState({ qrcode_Submit: e.target.value })}/>
                          <span className="pure-form-message">This is a required field.</span>
                          <button type="submit" className="pure-button pure-button-primary"> Register appointment </button>
                      </fieldset>
                  </form>

                </div>)
                 : 
              (<div></div>) 

    let WithdrawForm = (this.state.openWithdraw )? (  
                <div>
                  <form className="pure-form pure-form-stacked" onSubmit={this.releaseRemittance}>
                      <fieldset>
                          <button type="submit" className="pure-button pure-button-primary"> Witdrawn balance?</button>
                      </fieldset>
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
              <p>User balance: {this.state.userBalance} Ether </p>
              {this.state.statusMessage}
              <br />  <br />

<table className="pure-table">
    <tbody>
        <tr>
            <td> <form onSubmit={this.createNewRemittance}>                       
                      <button className="pure-button pure-button-active" type="submit"> Create a new Chain Doctor Remittance </button>
              </form>

              </td>
            <td> 
              <form onSubmit={this.setupRemittanceProcess}>                       
                      <button className="pure-button pure-button-active" type="submit"> Setup Chain Doctor Remittance (add doctor address to receive payment)</button>
              </form></td>
            
        </tr>

        <tr>
            <td><form onSubmit={this.openPayAppointmentForm}>                       
                      <button className="pure-button pure-button-active" type="submit"> Register appointment </button>
              </form>
              </td>
            <td>
              <form onSubmit={this.openWithdrawForm}>                       
                      <button className="pure-button pure-button-active" type="submit"> Withdrawn </button>
              </form></td>
            
        </tr>
    </tbody>
</table>

            </div>
          </div>
          <div><br /></div>
          <div>{CreateNewRemittanceForm}</div>
          <div>{SetupRemittance}</div>
          <div>{PayAppointmentForm}</div>
          <div>{WithdrawForm}</div>





        </main>
      </div>

    );
  }
}

export default App
