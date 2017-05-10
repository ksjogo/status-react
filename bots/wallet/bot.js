function round(n) {
    return Math.round(n * 100) / 100;
}

function calculateFee(n, tx) {
    var estimatedGas = 21000;
    if (tx !== null) {
        estimatedGas = web3.eth.estimateGas(tx);
    }

    return web3.fromWei(web3.eth.gasPrice * Math.pow(2, n - 5) * estimatedGas, "ether");
}

function calculateGasPrice(n) {
    return web3.eth.gasPrice * Math.pow(2, n - 5);
}

status.defineSubscription(
    "calculatedFee",
    {value: ["sliderValue"], tx: ["transaction"]},
    function (params) {
        return calculateFee(params.value, params.tx);
    }
);

function getFeeExplaination(n) {
    return I18n.t('send_explaination') + I18n.t('send_explaination_' + n);
}

status.defineSubscription(
    "feeExplaination",
    {value: ["sliderValue"]},
    function(params) {
        return getFeeExplaination(params.value);
    }
)

function amountParameterBox(params, context) {
    var txData = {
        to: params["bot-db"]["contact"]["address"],
        value: web3.toWei(params.args[1]) || 0
    };

    var sliderValue = params["bot-db"]["sliderValue"] || 5;

    status.setDefaultDb({
        transaction: txData,
        calculatedFee: calculateFee(sliderValue, txData),
        feeExplaination: getFeeExplaination(sliderValue),
        sliderValue: sliderValue
    });

    return {
        title: I18n.t('send_title'),
        showBack: true,
        markup: status.components.scrollView(
            {
                keyboardShouldPersistTaps: "always"
            },
            [status.components.view(
                {
                    flex: 1
                },
                [
                    status.components.text(
                        {
                            style: {
                                fontSize: 14,
                                color: "rgb(147, 155, 161)",
                                paddingTop: 12,
                                paddingLeft: 16,
                                paddingRight: 16,
                                paddingBottom: 20
                            }
                        },
                        I18n.t('send_specify_amount')
                    ),
                    status.components.touchable(
                        {
                            onPress: status.components.dispatch([status.events.FOCUS_INPUT, []])
                        },
                        status.components.view(
                            {
                                flexDirection: "row",
                                alignItems: "center",
                                textAlign: "center",
                                justifyContent: "center"
                            },
                            [
                                status.components.text(
                                    {
                                        font: "light",
                                        style: {
                                            fontSize: 38,
                                            marginLeft: 8,
                                            color: "black"
                                        }
                                    },
                                    params.args[1] || "0.00"
                                ),
                                status.components.text(
                                    {
                                        font: "light",
                                        style: {
                                            fontSize: 38,
                                            marginLeft: 8,
                                            color: "rgb(147, 155, 161)"
                                        }
                                    },
                                    I18n.t('eth')
                                ),
                            ]
                        )
                    ),
                    status.components.text(
                        {
                            style: {
                                fontSize: 14,
                                color: "rgb(147, 155, 161)",
                                paddingTop: 14,
                                paddingLeft: 16,
                                paddingRight: 16,
                                paddingBottom: 5
                            }
                        },
                        I18n.t('send_fee')
                    ),
                    status.components.view(
                        {
                            flexDirection: "row"
                        },
                        [
                            status.components.text(
                                {
                                    style: {
                                        fontSize: 17,
                                        color: "black",
                                        paddingLeft: 16
                                    }
                                },
                                [status.components.subscribe(["calculatedFee"])]
                            ),
                            status.components.text(
                                {
                                    style: {
                                        fontSize: 17,
                                        color: "rgb(147, 155, 161)",
                                        paddingLeft: 4,
                                        paddingRight: 4
                                    }
                                },
                                I18n.t('eth')
                            )
                        ]
                    ),
                    status.components.slider(
                        {
                            maximumValue: 10,
                            value: 5,
                            minimumValue: 0,
                            onSlidingComplete: status.components.dispatch(
                                [status.events.UPDATE_DB, "sliderValue"]
                            ),
                            step: 1,
                            style: {
                                marginLeft: 16,
                                marginRight: 16
                            }
                        }
                    ),
                    status.components.view(
                        {
                            flexDirection: "row"
                        },
                        [
                            status.components.text(
                                {
                                    style: {
                                        flex: 1,
                                        fontSize: 14,
                                        color: "rgb(147, 155, 161)",
                                        paddingLeft: 16,
                                        alignSelf: "flex-start"
                                    }
                                },
                                I18n.t('send_cheaper')
                            ),
                            status.components.text(
                                {
                                    style: {
                                        flex: 1,
                                        fontSize: 14,
                                        color: "rgb(147, 155, 161)",
                                        paddingRight: 16,
                                        alignSelf: "flex-end",
                                        textAlign: "right"
                                    }
                                },
                                I18n.t('send_faster')
                            )
                        ]
                    ),
                    status.components.text(
                        {
                            style: {
                                fontSize: 14,
                                color: "black",
                                paddingTop: 16,
                                paddingLeft: 16,
                                paddingRight: 16,
                                paddingBottom: 16,
                                lineHeight: 24
                            }
                        },
                        [status.components.subscribe(["feeExplaination"])]
                    )
                ]
            )]
        )
    };
}

var paramsSend = [
    {
        name: "recipient",
        type: status.types.TEXT,
        suggestions: function (params) {
            return {
                title: I18n.t('send_title'),
                markup: status.components.chooseContact(I18n.t('send_choose_recipient'), 0)
            };
        }
    },
    {
        name: "amount",
        type: status.types.NUMBER,
        suggestions: amountParameterBox
    }
];

function validateSend(params, context) {
    if (!params["bot-db"]["contact"]["address"]) {
        return {
            markup: status.components.validationMessage(
                "Wrong address",
                "Recipient address must be specified"
            )
        };
    }
    if (!params["amount"]) {
        return {
            markup: status.components.validationMessage(
                I18n.t('validation_title'),
                I18n.t('validation_amount_specified')
            )
        };
    }

    var amount = params.amount.replace(",", ".");
    var amountSplitted = amount.split(".");
    if (amountSplitted.length === 2 && amountSplitted[1].length > 18) {
        return {
            markup: status.components.validationMessage(
                I18n.t('validation_title'),
                I18n.t('validation_amount_is_too_small')
            )
        };
    }

    try {
        var val = web3.toWei(amount, "ether");
        if (val <= 0) {
            throw new Error();
        }
    } catch (err) {
        return {
            markup: status.components.validationMessage(
                I18n.t('validation_title'),
                I18n.t('validation_invalid_number')
            )
        };
    }

    var balance = web3.eth.getBalance(context.from);
    var fee = calculateFee(
        params["bot-db"]["sliderValue"],
        {
            to: params["bot-db"]["contact"]["address"],
            value: val
        }
    );

    if (bn(val).plus(bn(web3.toWei(fee, "ether"))).greaterThan(bn(balance))) {
        return {
            markup: status.components.validationMessage(
                I18n.t('validation_title'),
                I18n.t('validation_insufficient_amount')
                + web3.fromWei(balance, "ether")
                + " ETH)"
            )
        };
    }
}

function handleSend(params, context) {
    var val = web3.toWei(params["amount"].replace(",", "."), "ether");

    var data = {
        from: context.from,
        to: params["bot-db"]["contact"]["address"],
        value: val,
        gasPrice: calculateGasPrice(params["bot-db"]["sliderValue"])
    };

    try {
        return web3.eth.sendTransaction(data);
    } catch (err) {
        return {error: err.message};
    }
}

var send = {
    name: "send",
    icon: "money_white",
    color: "#5fc48d",
    title: I18n.t('send_title'),
    description: I18n.t('send_description'),
    params: paramsSend,
    preview: function (params, context) {
        var amountStyle = {
            fontSize: 36,
            color: "#000000",
            height: 40
        };

        var amount = status.components.view(
            {
                flexDirection: "column",
                alignItems: "flex-end",
            },
            [status.components.text(
                {
                    style: amountStyle,
                    font: "light"
                },
                status.localizeNumber(params.amount, context.delimiter, context.separator)
            )]);

        var currency = status.components.view(
            {
                style: {
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    paddingBottom: 0
                }
            },
            [status.components.text(
                {
                    style: {
                        color: "#9199a0",
                        fontSize: 16,
                        lineHeight: 18,
                        marginLeft: 7.5
                    }
                },
                I18n.t('eth')
            )]
        );

        return {
            markup: status.components.view(
                {
                    style: {
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 8,
                        marginBottom: 8
                    }
                },
                [amount, currency]
            )
        };
    },
    shortPreview: function (params, context) {
        return {
            markup: status.components.text(
                {},
                I18n.t('send_title') + ": "
                + status.localizeNumber(params.amount, context.delimiter, context.separator)
                + " ETH"
            )
        };
    },
    handler: handleSend,
    validator: validateSend
};

status.command(send);
status.response(send);

status.command({
    name: "request",
    color: "#5fc48d",
    title: I18n.t('request_title'),
    description: I18n.t('request_description'),
    sequentialParams: true,
    params: [{
        name: "amount",
        type: status.types.NUMBER
    }],
    handler: function (params) {
        return {
            event: "request",
            params: [params.amount],
            request: {
                command: "send",
                params: {
                    amount: params.amount
                }
            }
        };
    },
    preview: function (params, context) {
        return {
            markup: status.components.text(
                {},
                I18n.t('request_requesting') + " "
                + status.localizeNumber(params.amount, context.delimiter, context.separator)
                + " ETH"
            )
        };
    },
    shortPreview: function (params, context) {
        return {
            markup: status.components.text(
                {},
                I18n.t('request_requesting') + " "
                + status.localizeNumber(params.amount, context.delimiter, context.separator)
                + " ETH"
            )
        };
    },
    validator: function (params) {
        try {
            var val = web3.toWei(params.amount.replace(",", "."), "ether");
            if (val <= 0) {
                throw new Error();
            }
        } catch (err) {
            return {
                markup: status.components.validationMessage(
                    I18n.t('validation_title'),
                    I18n.t('validation_invalid_number')
                )
            };
        }
    }
});
