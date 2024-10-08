import { useState, useEffect, useContext } from 'react'
import { contractAddress, contractABI } from './constants'
import { ethers } from 'ethers'
import { AiOutlineCopy } from 'react-icons/ai'
import { IoOpenOutline } from 'react-icons/io5'

import axios from 'axios'
import FormData from 'form-data'

import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function App() {
    const [state, setState] = useState({
        provider: null,
        signer: null,
        contract: null,
    })
    // const { state: s, setProvider } = useContext(Context)
    // console.log({ state: s })
    const [connected, setConnected] = useState(false)
    const [cid, setCid] = useState('')
    const [signature, setSignature] = useState('')
    const [page, setPage] = useState('sign')
    const [account, setAccount] = useState('')
    const [showSignerInput, setShowSignerInput] = useState(false)
    const [signedTxData, setSignedTxData] = useState([])
    const [receivedTxData, setReceivedTxData] = useState([])

    const connectWallet = async () => {
        try {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts',
                })
                // switching to correct network
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    // params: [{ chainId: '0xaa36a7' }], // chainId must be in hexadecimal
                    params: [{ chainId: '0x539' }], // Use the chainId of your local test network here Ganache
                })
                setAccount(accounts[0])

                const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                )
                const signer = provider.getSigner()
                const contract = new ethers.Contract(
                    contractAddress,
                    contractABI,
                    signer
                )
                setState({ provider, signer, contract })
                console.log('connected accounts', accounts)
                document.getElementById('connect_button').innerHTML =
                    'connected'
                setConnected(true)
            } else {
                alert('Please install metamask')
            }
        } catch (error) {
            console.log(error)
        }
    }

    // const connectWallet = async () => {
    //     try {
    //         if (window.ethereum) {
    //             const accounts = await window.ethereum.request({
    //                 method: 'eth_requestAccounts',
    //             });

    //             try {
    //                 // Attempt to switch to the Hardhat network
    //                 await window.ethereum.request({
    //                     method: 'wallet_switchEthereumChain',
    //                     params: [{ chainId: '0x7A69' }], // Hardhat default network ID 31337 in hexadecimal
    //                 });
    //             } catch (switchError) {
    //                 // If the chain has not been added to MetaMask, you'll need to ask the user to add it
    //                 if (switchError.code === 4902) {
    //                     try {
    //                         await window.ethereum.request({
    //                             method: 'wallet_addEthereumChain',
    //                             params: [{
    //                                 chainId: '0x7A69',
    //                                 rpcUrl: 'http://127.0.0.1:8545/',
    //                                 // Additional parameters can be added here
    //                             }],
    //                         });
    //                     } catch (addError) {
    //                         // Handle the error from adding a network
    //                         console.error(addError);
    //                     }
    //                 }
    //                 console.error(switchError);
    //             }

    //             setAccount(accounts[0]);

    //             const provider = new ethers.providers.Web3Provider(window.ethereum);
    //             const signer = provider.getSigner();
    //             const contract = new ethers.Contract(contractAddress, contractABI, signer);
    //             setState({ provider, signer, contract });
    //             console.log('Connected accounts', accounts);
    //             document.getElementById('connect_button').innerHTML = 'Connected';
    //             setConnected(true);
    //         } else {
    //             alert('Please install MetaMask');
    //         }
    //     } catch (error) {
    //         console.error(error);
    //     }
    // };


    async function uploadImg() {
        console.log('upppload image calllled')

        const formData = new FormData()
        const file = document.getElementById('file').files[0]

        console.log('file is : ', file)
        if (!file) {
            console.log('file not uploaded')
            toast.error('please select the certificate first!', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            })
            return
        }
        formData.append('file', file)
        console.log(formData)

        console.log('new pinata ipfs added')
        toast('Uploading...please wait', {
            position: "top-right",
            autoClose: 7000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });

        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    pinata_api_key: "863e02321616ef7b8b3b",
                    pinata_secret_api_key: "6b2dc3be45d4f1b5e17f78c69598ec82bdd97f463e0987f9524b695a9a349f5d",
                },
            }
        )
        console.log('ipfs hash generated!')
        console.log(response.data.IpfsHash)
        setCid(response.data.IpfsHash)
        console.log('Content added with CID:', cid)
    }

    async function getSignature() {
        if (!cid) {
            console.log('cid is', cid)
            console.log('toastify error')
            toast.error('please upload the certificate to IPFS first!', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            })
            return
        }
        const packedMessage = ethers.utils.solidityPack(['string'], [cid])
        console.log('packed msg: ', packedMessage)
        const hash = ethers.utils.keccak256(packedMessage)

        const res = await window.ethereum.request({
            method: 'personal_sign',
            params: [account, hash],
        })
        console.log('signature:', res)
        setSignature(res)
    }

    async function checkValidity() {
        let signingAuthority = document.querySelector('#signer').value
        if (signingAuthority[0] === '"') {
            signingAuthority = signingAuthority.substring(
                1,
                signingAuthority.length - 1
            )
        }
        const msg = document.querySelector('#msg').value
        const signature = document.querySelector('#signature').value
        const valid = await state.contract.verify(
            signingAuthority,
            msg,
            signature
        )
        console.log('signature is', valid)
        document.querySelector('#valid').innerHTML = `<h1>${valid}</h1>`
    }

    async function saveData() {
        const receiver = document.querySelector('#receiver').value
        const message = document.querySelector('#message').value

        console.log(receiver, message, cid)
        console.log(signature)
        console.log(account)

        console.log('sendign transactoin...')

        toast.info('Transaction submitted to the blockchain!', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });

        const saved = await state.contract.storeSignature(
            account,
            receiver,
            cid.toString(),
            signature,
            message
        )
        await saved.wait()
        toast.success('data successfully stored in blockchain! Check the data section', {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
        });
        console.log('saveData ', saved)
    }

    async function setSenderData() {
        console.log('setsenderData is called...!!')
        console.log('account: ', account)
        if (state.contract) {
            console.log('contract is: ', state.contract)
            const senderTxIds =
                await state.contract.retrieveSenderSignaturesTxIds(account)
            console.log(senderTxIds)
            setSignedTxData([])
            await senderTxIds.forEach(async (id) => {
                const transaction = await state.contract.getTransactionById(id)
                setSignedTxData((prev) => [...prev, transaction])
            })
        }
    }

    // async function setReceiverData() {
    //     if (state.contract) {
    //         const receiverTxIds =
    //             await state.contract.retrieveRecieverSignaturesTxIds(account)

    //         setReceivedTxData([])
    //         console.log('receiverTxIds', receiverTxIds)
    //         await receiverTxIds.forEach(async (id) => {
    //             const transaction = await state.contract.getTransactionById(id)
    //             setReceivedTxData((prev) => [...prev, transaction])
    //         })
    //     }
    // }

    async function setReceiverData() {
        if (state.contract) {
            const receiverTxIds = await state.contract.retrieveRecieverSignaturesTxIds(account);

            setReceivedTxData([]);
            console.log('receiverTxIds', receiverTxIds);

            const transactions = await Promise.all(receiverTxIds.map(async id => {
                return await state.contract.getTransactionById(id);
            }));

            setReceivedTxData(transactions);
        }
    }



    async function getSignerAddress() {
        const msg = document.querySelector('#msg').value //msg = cid
        const signature = document.querySelector('#signature').value
        const signerAddress = await state.contract.getSigner(msg, signature)
        console.log('signature is', signerAddress)
        document.querySelector('#valid').innerHTML = `<h1>${signerAddress}</h1>`
    }

    return (
        <div className='bg-[#E4E4D0] min-h-screen max-h-full'>
            <div className='flex justify-between items-center bg-[#94A684] '>
                <div className='m-4 ml-8 text-2xl '>
                    {/* Certificate Verification dApp */}
                    <span className='font-bold'>DOCCHAIN</span>
                </div>
                <div className='mx-8 my-2'>
                    <button
                        onClick={connectWallet}
                        id='connect_button'
                        className='bg-[#AEC3AE] m-4 p-4 px-20 rounded-md'
                    >
                        connect wallet
                    </button>
                </div>
            </div>

            {connected ? (
                <div>
                    <div className='flex flex-row justify-center'>
                        <div
                            className={`text-3xl cursor-pointer mx-20 m-4 p-2 rounded-md ${page === 'sign' ? 'bg-[#94A684]' : ''
                                }`}
                            onClick={() => setPage('sign')}
                        >
                            Sign
                        </div>
                        <div
                            className={`text-3xl cursor-pointer mx-20 m-4 p-2 rounded-md ${page === 'verify' ? 'bg-[#94A684]' : ''
                                }`}
                            onClick={() => setPage('verify')}
                        >
                            Verify
                        </div>
                        <div
                            className={`text-3xl cursor-pointer mx-20 m-4 p-2 rounded-md ${page === 'data' ? 'bg-[#94A684]' : ''
                                }`}
                            onClick={() => {
                                setPage('data')
                                setSenderData()
                                setReceiverData()
                            }}
                        >
                            Data
                        </div>
                    </div>
                    {page === 'sign' && (
                        <div className='flex flex-col md:flex-row w-screen '>
                            <div className='md:w-1/2 p-4'>
                                <div className='text-2xl  font-bold'>
                                    Certificate verification dapp
                                </div>
                                <div className='text-xl'>
                                    This application solves the problem of
                                    certificate counterfeiting in today's world.
                                    The Organizations can sign the certificate
                                    provided to the candidate using their
                                    private key and anyone can verify the same
                                    using the signature provided to the receiver
                                    alongwith the cid and the public key of the
                                    signing organization
                                </div>
                                <div className='text-xl underline font-semibold'>
                                    steps involved:
                                </div>
                                <ol className='list-decimal ml-4 list-outside text-xl'>
                                    <li>upload certificate to the IPFS</li>
                                    <li>
                                        sign the generated CID using the
                                        organization's private key
                                    </li>
                                    <li>
                                        store the cid and signature in the
                                        blockchain along with the receiver's
                                        address and the message.
                                    </li>
                                </ol>
                            </div>
                            <div className='flex flex-col md:w-1/2 rounded-lg border-white border-4 justify-self-center items-center'>
                                {cid ? (
                                    <div className='m-4'>
                                        <span className='font-semibold'>
                                            cid:{' '}
                                        </span>
                                        {`${cid}`}
                                    </div>
                                ) : (
                                    <div className='flex flex-col md:flex-row justify-around items-center m-4'>
                                        <div className=''>
                                            <input type='file' id='file' />
                                        </div>
                                        <button
                                            onClick={uploadImg}
                                            className='bg-[#AEC3AE] rounded-md'
                                        >
                                            <div className='m-2'>
                                                Upload to IPFS
                                            </div>
                                        </button>
                                    </div>
                                )}
                                {signature ? (
                                    <div className='m-4 flex flex-row items-center'>
                                        <div className='w-full overflow-hidden '>
                                            {`${signature.slice(0, 20)}...`}
                                        </div>
                                        <div
                                            onClick={async () => {
                                                await navigator.clipboard.writeText(
                                                    signature
                                                )
                                            }}
                                            className='cursor-pointer'
                                        >
                                            <AiOutlineCopy />
                                        </div>
                                    </div>
                                ) : (
                                    <div className='w-full p-4'>
                                        <button
                                            onClick={getSignature}
                                            className='bg-[#AEC3AE] w-full p-4 rounded-md'
                                        >
                                            Sign the CID
                                        </button>
                                    </div>
                                )}
                                <div>
                                    <input
                                        type='text'
                                        className='border-black border m-2 p-2 rounded-md'
                                        placeholder='receiver address(0xed7852...)'
                                        id='receiver'
                                    />
                                </div>
                                <div>
                                    <input
                                        type='text'
                                        className='border-black border m-2 p-2 rounded-md'
                                        placeholder='certificate data'
                                        id='message'
                                    />
                                </div>
                                <div>
                                    {signature && (
                                        <button
                                            className='bg-[#AEC3AE] w-full p-4 rounded-md m-4'
                                            onClick={saveData}
                                        >
                                            save to blockchain
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {page === 'verify' && (
                        <div className='flex w-full justify-around'>
                            <div className='max-w-screen-sm'>
                                <div className='font-bold text-2xl'>
                                    Verify certificate's authenticity
                                </div>
                                <div className='text-xl'>
                                    <span className=' underline font-semibold'>
                                        steps involved:
                                    </span>
                                    <ol className='list-decimal list-outside ml-4'>
                                        <li>
                                            get the cid and the signature of the
                                            signer from the data section
                                        </li>
                                        <li>
                                            paste the cid and signature in the
                                            provided input fields
                                        </li>
                                        <li>
                                            If you have address of the
                                            organization as well, choose the
                                            option given below and paste the
                                            organization's address as well
                                        </li>
                                        <li>
                                            hit the button to get the signing
                                            authority in case you didn't
                                            provided the address and the boolean
                                            value in case you provided the
                                            certificate as well
                                        </li>
                                    </ol>
                                </div>
                            </div>
                            <div className='flex flex-col items-center'>
                                <div className='flex flex-row items-center'>
                                    <div className='text-2xl font-semibold indie'>
                                        cid:{' '}
                                    </div>
                                    <input
                                        type='text'
                                        id='msg'
                                        className='border-black border m-2 p-2 rounded-md'
                                        placeholder='signed message'
                                    />
                                </div>
                                <div className='flex flex-row items-center'>
                                    <div className='text-2xl font-semibold indie'>
                                        signature:{' '}
                                    </div>
                                    <input
                                        type='text'
                                        id='signature'
                                        className='border-black border m-2 p-2 rounded-md'
                                        placeholder='signature'
                                    />
                                </div>
                                {showSignerInput && (
                                    <div className='flex flex-row items-center'>
                                        <div className='text-2xl font-semibold indie'>
                                            signer address:{' '}
                                        </div>
                                        <input
                                            type='text'
                                            id='signer'
                                            className='border-black border m-2 p-2 rounded-md'
                                            placeholder='signing authority'
                                        />
                                    </div>
                                )}
                                <div className='flex flex-col justify-center items-center'>
                                    {!showSignerInput ? (
                                        <button
                                            onClick={getSignerAddress}
                                            className='bg-[#AEC3AE] m-4 mb-1 p-4 px-20 rounded-md indie font-semibold text-2xl'
                                        >
                                            Get the signer address
                                        </button>
                                    ) : (
                                        <button
                                            onClick={checkValidity}
                                            className='bg-[#AEC3AE] m-4 mb-1 p-4 px-20 rounded-md indie font-semibold text-2xl'
                                        >
                                            Get the confirmation for address
                                        </button>
                                    )}
                                    <div
                                        id='valid'
                                        className='text-2xl font-semibold'
                                    ></div>
                                </div>
                                {!showSignerInput ? (
                                    <div
                                        className='text-sm indie text-blue-900 cursor-pointer'
                                        onClick={() => {
                                            setShowSignerInput(true)
                                        }}
                                    >
                                        already have the signer address? try
                                        this
                                    </div>
                                ) : (
                                    <div
                                        className='text-sm indie text-blue-900 cursor-pointer'
                                        onClick={() => {
                                            setShowSignerInput(false)
                                        }}
                                    >
                                        didn't have the signer address?
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {page === 'data' && (
                        <div className='flex w-full justify-around'>
                            <div className='border border-black w-full m-4 pt-0 p-2 rounded-2xl  font-semibold'>
                                <div className='underline underline-offset-2 mb-2 indie'>
                                    messages you signed:
                                </div>
                                {signedTxData.map((tx) => {
                                    return (
                                        <div className='border border-black mx-2 rounded-2xl p-2'>
                                            <div className='indie'>
                                                timestamp:{' '}
                                                {tx.timestamp.toString()}
                                            </div>
                                            <div className='indie'>
                                                receiver: {tx.sender}
                                            </div>
                                            <div className='flex items-center'>
                                                <div className='indie'>
                                                    signature:{' '}
                                                    {`${tx.signature.slice(
                                                        0,
                                                        40
                                                    )}...`}
                                                </div>
                                                <div
                                                    onClick={async () => {
                                                        await navigator.clipboard.writeText(
                                                            tx.signature
                                                        )
                                                    }}
                                                    className='cursor-pointer indie'
                                                >
                                                    <AiOutlineCopy />
                                                </div>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <div>cid: {tx.cid}</div>
                                                <a
                                                    href={`ipfs://${tx.cid}/`}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                >
                                                    <IoOpenOutline />
                                                </a>
                                            </div>
                                            <div className='indie'>
                                                message: {tx.message}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className='border border-black w-full m-4 pt-0 p-2 rounded-2xl  font-semibold'>
                                <div className='underline underline-offset-2 mb-2 indie'>
                                    signatures you received:
                                </div>
                                {receivedTxData.map((tx) => {
                                    return (
                                        <div className='border border-black mx-2 rounded-2xl p-2'>
                                            <div className='indie'>
                                                timestamp:{' '}
                                                {tx.timestamp.toString()}
                                            </div>
                                            <div className='indie'>
                                                signer: {tx.sender}
                                            </div>
                                            <div className='flex items-center'>
                                                <div className='indie'>
                                                    signature:{' '}
                                                    {`${tx.signature.slice(
                                                        0,
                                                        40
                                                    )}...`}
                                                </div>
                                                <div
                                                    onClick={async () => {
                                                        await navigator.clipboard.writeText(
                                                            tx.signature
                                                        )
                                                    }}
                                                    className='cursor-pointer indie'
                                                >
                                                    <AiOutlineCopy />
                                                </div>
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <div>cid: {tx.cid}</div>
                                                <a
                                                    href={`ipfs://${tx.cid}/`}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                >
                                                    <IoOpenOutline />
                                                </a>
                                            </div>
                                            <div className='indie'>
                                                message: {tx.message}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className='text-3xl font-semibold flex justify-center'>
                    Please connect the wallet first!!
                </div>
            )}
            <ToastContainer />
        </div>
    )
}

export default App
