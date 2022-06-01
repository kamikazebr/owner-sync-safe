// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "forge-std/Test.sol";

import "../src/MyModule.sol";
import "../src/Button.sol";
import "../src/mock/MockSafe.sol";

contract MyModuleTest is DSTest {

  MockSafe safe;
  MyModule myModule;
  Button button;

  function setUp() public{
    safe = new MockSafe();

    button = new Button();
    button.transferOwnership(address(safe));
    
    myModule = new MyModule(address(this), address(button));
    myModule.setAvatar(address(0));
    myModule.setTarget(address(safe));
    myModule.transferOwnership(address(safe));

    safe.enableModule(address(myModule));
  }

  function testPushButton() public {
    emit log_named_string("before button.pushes", uint2str(button.pushes()));    
    myModule.pushButton();
    emit log_named_string("after button.pushes", uint2str(button.pushes()));    
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

