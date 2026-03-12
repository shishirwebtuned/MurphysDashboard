import Router from "express"

import { addToCart, getCartByUserId, removeFromCart, clearCart, updateCartStatus, getAllCarts, deleteCart } from "../conttrolers/cart.contllors"
const cartRouter =  Router()

cartRouter.post('/add', addToCart)
cartRouter.get('/all', getAllCarts)
cartRouter.get('/:userid', getCartByUserId)
cartRouter.post('/remove', removeFromCart)
cartRouter.post('/clear', clearCart)
cartRouter.delete('/delete', deleteCart)
cartRouter.patch('/update-status', updateCartStatus)


export default cartRouter

