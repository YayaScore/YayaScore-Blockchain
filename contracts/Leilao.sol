// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EtherAuction {
    event Start();
    event Bid(address indexed sender, uint256 amount);
    event Withdraw(address indexed bidder, uint256 amount);
    event End(address winner, uint256 amount);
    event Debug(string message, uint256 value); // Evento de debug
    event DebugAddress(string message, address addr); // Evento de debug para endereços

    address payable public seller;
    uint256 public endAt;
    bool public started;
    bool public ended;

    address public highestBidder;
    uint256 public highestBid;
    mapping(address => uint256) public bids;
    address[] public bidders;

    constructor() {
        seller = payable(msg.sender);
    }

    function start(uint256 _startingBid) external {
        require(!started, "Auction already started");
        require(msg.sender == seller, "Only the seller can start the auction");

        highestBid = _startingBid;
        started = true;
        endAt = block.timestamp +  1 minutes; // Para testes rápidos

        emit Start();
        emit Debug("Auction started", block.timestamp); // Log de debug
    }

    function bid() external payable {
        require(started, "Auction not started");
        require(block.timestamp < endAt, "Auction ended");
        require(msg.value > highestBid, "Bid must be higher than the current highest bid");

        if (highestBidder != address(0)) {
            bids[highestBidder] += highestBid;
        }

        if (bids[msg.sender] == 0) {
            bidders.push(msg.sender);
        }

        highestBidder = msg.sender;
        highestBid = msg.value;

        emit Bid(msg.sender, msg.value);
        emit DebugAddress("New highest bidder", msg.sender); // Log de debug
        emit Debug("New highest bid", msg.value); // Log de debug
    }

    function withdraw() external {
        uint256 bal = bids[msg.sender];
        require(bal > 0, "No funds to withdraw");
        bids[msg.sender] = 0;
        payable(msg.sender).transfer(bal);

        emit Withdraw(msg.sender, bal);
        emit DebugAddress("Withdrawn by bidder", msg.sender); // Log de debug
        emit Debug("Withdrawn amount", bal); // Log de debug
    }

    function end() external {
        require(started, "Auction not started");
        require(block.timestamp >= block.timestamp, "Auction not ended");
        require(!ended, "Auction already ended");

        ended = true;
        emit Debug("Ending auction", block.timestamp); // Log de debug

        if (highestBidder != address(0)) {
            emit DebugAddress("Highest bidder", highestBidder); // Log de debug
            seller.transfer(highestBid);
            emit Debug("Transferred highest bid to seller", highestBid); // Log de debug
        }

        emit End(highestBidder, highestBid);

        // Refund all losing bids
        for (uint256 i = 0; i < bidders.length; i++) {
            address bidder = bidders[i];
            emit DebugAddress("Refunding bidder", bidder); // Log de debug
            if (bidder != highestBidder) {
                uint256 bidAmount = bids[bidder];
                if (bidAmount > 0) {
                    bids[bidder] = 0;
                    payable(bidder).transfer(bidAmount);
                    emit Debug("Refunded bid to bidder", bidAmount); // Log de debug
                }
            }
        }
    }
}
