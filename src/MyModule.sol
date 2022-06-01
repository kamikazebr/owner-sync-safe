// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "@gnosis.pm/zodiac/contracts/core/Module.sol";
import "../src/roles/Roles.sol";

contract MyModule is Module {
  address public button;
  Roles roles;
  uint16 constant ROLE_ID  = 0;


  event PushButton(string);

  constructor(address _owner, address _target, address _button){
    bytes memory initializeParams = abi.encode(_owner,_target, _button);
    setUp(initializeParams);
  }

  function setUp(bytes memory initializeParams) public override initializer{
    __Ownable_init();
    (address _owner, address _target ,  address _button) = abi.decode(initializeParams,(address, address, address));

    button = _button;
    setAvatar(_owner); 
    setTarget(_target);
    transferOwnership(_owner);

    roles = new Roles(address(this),address(_target),address(_target));
    
    IAvatar(_target).enableModule(address(roles));

    uint16[] memory tempRole = new uint16[](1);
    tempRole[0] = ROLE_ID;


    bool[] memory tempMemberOf = new bool[](1);
    tempMemberOf[0] = true;

    address targetAddress = address(button);

    roles.assignRoles(address(this),tempRole,tempMemberOf);
    // roles.assignRoles(targetAddress,tempRole,tempMemberOf);
    
    roles.scopeTarget(ROLE_ID, targetAddress);
    // roles.allowTarget(ROLE_ID, targetAddress, ExecutionOptions.Both);
// 

    roles.scopeAllowFunction(ROLE_ID, targetAddress, bytes4(0x0a007972), ExecutionOptions.Both);
  }

  function pushButton() external{
    emit PushButton("Mymodule");
    exec(
      button,
      0,
      abi.encodePacked(bytes4(keccak256("pushButton()"))),
      Enum.Operation.Call);
  }


  function pushButtonWithRoles() external{
    emit PushButton("Mymodule");
    roles.execTransactionFromModule(
      button,
      0,
      abi.encodePacked(bytes4(keccak256("pushButton()"))),
      Enum.Operation.Call);
  }
  
}

