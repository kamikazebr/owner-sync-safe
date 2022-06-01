// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Test.sol";

import "../src/MyModule.sol";
import "../src/Button.sol";
import "../src/mock/MockSafe.sol";
import "../src/roles/Permissions.sol";
import "../src/roles/Roles.sol";

contract MyModuleTest is DSTest {

  MockSafe safe;
  MyModule myModule;
  Button button;
  Roles roles;

  uint16 constant ROLE_ID  = 0;

  function setUp() public{
    safe = new MockSafe();

    button = new Button();
    button.transferOwnership(address(safe));

    myModule = new MyModule(address(this), address(safe), address(button));
    // roles = new Roles(address(this),address(safe),address(safe));
        

    // roles.setDefaultRole(address(myModule), ROLE_ID);
    // roles.setDefaultRole(address(safe), ROLE_ID);
    // safe.enableModule(address(roles));
    // roles.enableModule(address(myModule));
  }
  // function testPushButton() public {
  //   emit log_named_string("before button.pushes", uint2str(button.pushes()));    
  //   myModule.pushButton();
  //   emit log_named_string("after button.pushes", uint2str(button.pushes()));    
  //   assert(true);
  // }
  
  function testAddRole() public {
    // uint16[] memory tempRole = new uint16[](1);
    // tempRole[0] = ROLE_ID;


    // bool[] memory tempMemberOf = new bool[](1);
    // tempMemberOf[0] = true;

    // address targetAddress = address(button);

    // roles.assignRoles(address(myModule),tempRole,tempMemberOf);
    // // roles.assignRoles(targetAddress,tempRole,tempMemberOf);
    
    // roles.scopeTarget(ROLE_ID, targetAddress);
    // // roles.allowTarget(ROLE_ID, targetAddress, ExecutionOptions.Both);
// 

    // roles.scopeAllowFunction(ROLE_ID, targetAddress, bytes4(0x0a007972), ExecutionOptions.Both);
    // roles.scopeAllowFunction(ROLE_ID, targetAddress, bytes4(keccak256("pushButton()")), ExecutionOptions.Both);
    // roles.scopeAllowFunction(ROLE_ID, targetAddress, 0x6765bb99, ExecutionOptions.Both);
    myModule.pushButtonWithRoles();

    emit log("add role");    
    assert(true);
  }


function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}

